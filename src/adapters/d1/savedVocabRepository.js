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
    /**
     * Them mot tu do AI de xuat vao kho tu chung roi luu vao bo suu tap cua
     * nguoi hoc, gan tag de phan biet voi tu trong bai hoc. Tu nay khong thuoc
     * lesson nao nen khong lot vao pool cua cac game.
     */
    async saveGeneratedWord(userId, { term, meaning, type, example }, tag) {
      await db
        .prepare("INSERT INTO vocab (term, meaning, type, example) VALUES (?, ?, ?, ?) ON CONFLICT(term) DO NOTHING")
        .bind(term, meaning, type ?? null, example ?? null)
        .run();
      const vocab = await db.prepare("SELECT id FROM vocab WHERE term = ?").bind(term).first();
      if (!vocab) return null;
      await db.prepare("INSERT INTO tags (name) VALUES (?) ON CONFLICT(name) DO NOTHING").bind(tag).run();
      const tagRow = await db.prepare("SELECT id FROM tags WHERE name = ?").bind(tag).first();
      await db
        .prepare("INSERT INTO vocab_tags (vocab_id, tag_id) VALUES (?, ?) ON CONFLICT DO NOTHING")
        .bind(vocab.id, tagRow.id)
        .run();
      await db
        .prepare("INSERT INTO saved_vocab (user_id, vocab_id) VALUES (?, ?) ON CONFLICT(user_id, vocab_id) DO NOTHING")
        .bind(userId, vocab.id)
        .run();
      return vocab.id;
    },
    async listForUser(userId) {
      const { results } = await db
        .prepare(
          `SELECT v.id, v.term, v.meaning, v.example, v.word_family, l.id AS lesson_id, l.title AS lesson_title,
                  GROUP_CONCAT(DISTINCT tg.name) AS tags
           FROM saved_vocab s
           JOIN vocab v ON v.id = s.vocab_id
           LEFT JOIN lesson_vocab lv ON lv.vocab_id = v.id
           LEFT JOIN lessons l ON l.id = lv.lesson_id
           LEFT JOIN vocab_tags vt ON vt.vocab_id = v.id
           LEFT JOIN tags tg ON tg.id = vt.tag_id
           WHERE s.user_id = ?
           GROUP BY v.id
           ORDER BY s.created_at DESC`
        )
        .bind(userId)
        .all();
      return results;
    }
  };
}
