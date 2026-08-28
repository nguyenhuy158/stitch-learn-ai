/** @returns {import("../../ports/index.js").ChatRepository} */
export function createD1ChatRepository(db) {
  return {
    async listRecent(userId, conversationId, limit) {
      const { results } = await db.prepare(
        "SELECT role, content FROM chat_messages WHERE user_id = ? AND conversation_id = ? ORDER BY created_at DESC LIMIT ?"
      ).bind(userId, conversationId, limit).all();
      return results.reverse().map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));
    },
    async appendExchange(userId, conversationId, userMessage, modelMessage, metadata) {
      await db.batch([
        db.prepare("INSERT INTO chat_messages (user_id, conversation_id, role, content) VALUES (?, ?, ?, ?)")
          .bind(userId, conversationId, "user", userMessage),
        db.prepare("INSERT INTO chat_messages (user_id, conversation_id, role, content, metadata) VALUES (?, ?, ?, ?, ?)")
          .bind(userId, conversationId, "model", modelMessage, JSON.stringify(metadata))
      ]);
    },
    async listMessages(userId, conversationId, limit) {
      const { results } = await db.prepare(
        "SELECT * FROM chat_messages WHERE user_id = ? AND conversation_id = ? ORDER BY created_at ASC LIMIT ?"
      ).bind(userId, conversationId, limit).all();
      return results;
    },
    async listConversations(userId, limit) {
      // Tieu de = cau dau tien nguoi dung go (MIN theo created_at), khong luu rieng.
      const { results } = await db.prepare(
        `SELECT conversation_id AS id,
                MAX(created_at) AS last_at,
                COUNT(*) AS message_count,
                (SELECT content FROM chat_messages m2
                  WHERE m2.user_id = m.user_id AND m2.conversation_id = m.conversation_id AND m2.role = 'user'
                  ORDER BY m2.created_at ASC LIMIT 1) AS title
           FROM chat_messages m
          WHERE user_id = ?
          GROUP BY conversation_id
          ORDER BY last_at DESC
          LIMIT ?`
      ).bind(userId, limit).all();
      return results;
    },
    async listAll(userId, limit) {
      const { results } = await db.prepare(
        "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT ?"
      ).bind(userId, limit).all();
      return results;
    },
    async deleteConversation(userId, conversationId) {
      await db.prepare("DELETE FROM chat_messages WHERE user_id = ? AND conversation_id = ?")
        .bind(userId, conversationId).run();
    }
  };
}
