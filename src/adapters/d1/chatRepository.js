/** @returns {import("../../ports/index.js").ChatRepository} */
export function createD1ChatRepository(db) {
  return {
    async listRecent(userId, limit) {
      const { results } = await db.prepare(
        "SELECT role, content FROM chat_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT ?"
      ).bind(userId, limit).all();
      return results.reverse().map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));
    },
    async appendExchange(userId, userMessage, modelMessage, metadata) {
      await db.batch([
        db.prepare("INSERT INTO chat_messages (user_id, role, content) VALUES (?, ?, ?)").bind(userId, "user", userMessage),
        db.prepare("INSERT INTO chat_messages (user_id, role, content, metadata) VALUES (?, ?, ?, ?)").bind(userId, "model", modelMessage, JSON.stringify(metadata))
      ]);
    },
    async listAll(userId, limit) {
      const { results } = await db.prepare(
        "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ?"
      ).bind(userId, limit).all();
      return results;
    },
    async clearAll(userId) {
      await db.prepare("DELETE FROM chat_messages WHERE user_id = ?").bind(userId).run();
    }
  };
}
