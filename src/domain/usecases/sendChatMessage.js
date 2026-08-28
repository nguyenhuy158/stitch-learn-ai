import { recordLearningActivity } from "./recordLearningActivity.js";
import { localDate } from "../streak.js";
import { assertConversationId } from "../conversation.js";

export async function sendChatMessage({ userId, message, conversationId }, { userRepository, chatRepository, aiTutorPort }, now = new Date()) {
  const convo = assertConversationId(conversationId);
  const user = await userRepository.findById(userId);
  const level = user?.level || "B1";
  // Chi lay lich su cua dung cuoc tro chuyen nay, khong tron sang cuoc khac.
  const history = await chatRepository.listRecent(userId, convo, 10);
  const reply = await aiTutorPort.reply({ level, history, message, config: user?.gemini_config });
  await chatRepository.appendExchange(userId, convo, message, reply.message, {
    feedback: reply.feedback,
    corrections: reply.corrections
  });
  await userRepository.incrementXp(userId, 5, localDate(now));
  await recordLearningActivity({ userId }, { userRepository }, now);
  return reply;
}
