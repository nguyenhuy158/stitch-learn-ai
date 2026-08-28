import { recordLearningActivity } from "./recordLearningActivity.js";
import { localDate } from "../streak.js";

export async function sendChatMessage({ userId, message }, { userRepository, chatRepository, aiTutorPort }, now = new Date()) {
  const user = await userRepository.findById(userId);
  const level = user?.level || "B1";
  const history = await chatRepository.listRecent(userId, 10);
  const reply = await aiTutorPort.reply({ level, history, message, config: user?.gemini_config });
  await chatRepository.appendExchange(userId, message, reply.message, {
    feedback: reply.feedback,
    corrections: reply.corrections
  });
  await userRepository.incrementXp(userId, 5, localDate(now));
  await recordLearningActivity({ userId }, { userRepository }, now);
  return reply;
}
