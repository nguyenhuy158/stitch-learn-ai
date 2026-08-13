export async function clearChatHistory({ userId }, { chatRepository }) {
  await chatRepository.clearAll(userId);
}
