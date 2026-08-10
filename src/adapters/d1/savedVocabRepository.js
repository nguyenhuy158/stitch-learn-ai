/** @returns {import("../../ports/index.js").SavedVocabRepository} */
export function createD1SavedVocabRepository(db) {
  return {
    async save(userId, vocabId) {
      await db.prepare(
        "INSERT INTO saved_vocab (user_id, vocab_id) VALUES (?, ?) ON CONFLICT(user_id, vocab_id) DO NOTHING"
      ).bind(userId, vocabId).run();
    },
    async unsave(userId, vocabId) {
      await db.prepare("DELETE FROM saved_vocab WHERE user_id = ? AND vocab_id = ?").bind(userId, vocabId).run();
    },
    async listForUser(userId) {
      const { results } = await db
        .prepare(
          `SELECT v.id, v.term, v.meaning, v.example, l.id AS lesson_id, l.title AS lesson_title
           FROM saved_vocab s
           JOIN lesson_vocab v ON v.id = s.vocab_id
           JOIN lessons l ON l.id = v.lesson_id
           WHERE s.user_id = ?
           ORDER BY s.created_at DESC`
        )
        .bind(userId)
        .all();
      return results;
    }
  };
}
