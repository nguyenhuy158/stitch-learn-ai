export async function sendChatMessage({ userId, message }, { userRepository, chatRepository, aiTutorPort }) {
  const user = await userRepository.findById(userId);
  const level = user?.level || "B1";
  const history = await chatRepository.listRecent(userId, 10);
  const reply = await aiTutorPort.reply({ level, history, message });
  await chatRepository.appendExchange(userId, message, reply.message, {
    feedback: reply.feedback,
    corrections: reply.corrections
  });
  await userRepository.incrementXp(userId, 5);
  return reply;
}
