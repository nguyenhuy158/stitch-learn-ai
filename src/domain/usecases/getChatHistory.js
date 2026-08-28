import { assertConversationId } from "../conversation.js";

/** Tin nhan cua mot cuoc tro chuyen; khong truyen id thi lay tat ca (trang Lich su). */
export async function getChatHistory({ userId, conversationId }, { chatRepository }) {
  if (!conversationId) return chatRepository.listAll(userId, 50);
  return chatRepository.listMessages(userId, assertConversationId(conversationId), 100);
}

export async function listConversations({ userId }, { chatRepository }) {
  return chatRepository.listConversations(userId, 50);
}
