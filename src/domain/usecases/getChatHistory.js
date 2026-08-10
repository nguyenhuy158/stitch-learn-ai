export async function getChatHistory({ userId }, { chatRepository }) {
  return chatRepository.listAll(userId, 50);
}
