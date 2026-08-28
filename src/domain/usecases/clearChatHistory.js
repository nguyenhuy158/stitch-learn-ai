import { assertConversationId } from "../conversation.js";

/** Xoa mot cuoc tro chuyen. Cac cuoc khac giu nguyen. */
export async function clearChatHistory({ userId, conversationId }, { chatRepository }) {
  await chatRepository.deleteConversation(userId, assertConversationId(conversationId));
}
