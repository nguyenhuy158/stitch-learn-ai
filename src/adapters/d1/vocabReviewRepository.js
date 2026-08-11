/** @returns {import("../../ports/index.js").VocabReviewRepository} */
export function createD1VocabReviewRepository(db) {
  return {
    async listDue(userId, today, limit) {
      const { results } = await db
        .prepare(
          `SELECT v.id, v.term, v.meaning, v.example, v.word_family,
                  l.id AS lesson_id, l.title AS lesson_title,
                  r.interval_days, r.repetitions
           FROM vocab v
           LEFT JOIN lesson_vocab lv ON lv.vocab_id = v.id
           LEFT JOIN lessons l ON l.id = lv.lesson_id
           LEFT JOIN vocab_review r ON r.vocab_id = v.id AND r.user_id = ?
           WHERE r.vocab_id IS NULL OR r.due_date <= ?
           GROUP BY v.id
           ORDER BY (r.due_date IS NOT NULL) DESC, r.due_date ASC
           LIMIT ?`
        )
        .bind(userId, today, limit)
        .all();
      return results;
    },
    async get(userId, vocabId) {
      return db
        .prepare("SELECT * FROM vocab_review WHERE user_id = ? AND vocab_id = ?")
        .bind(userId, vocabId)
        .first();
    },
    async upsert(userId, vocabId, { easeFactor, intervalDays, repetitions, dueDate, reviewedAt }) {
      await db
        .prepare(
          `INSERT INTO vocab_review (user_id, vocab_id, ease_factor, interval_days, repetitions, due_date, last_reviewed)
           VALUES (?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, vocab_id) DO UPDATE SET
             ease_factor = excluded.ease_factor,
             interval_days = excluded.interval_days,
             repetitions = excluded.repetitions,
             due_date = excluded.due_date,
             last_reviewed = excluded.last_reviewed`
        )
        .bind(userId, vocabId, easeFactor, intervalDays, repetitions, dueDate, reviewedAt)
        .run();
    }
  };
}
