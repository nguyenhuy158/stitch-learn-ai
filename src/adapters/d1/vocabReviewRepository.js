/** @returns {import("../../ports/index.js").VocabReviewRepository} */
export function createD1VocabReviewRepository(db) {
  return {
    // Only vocab attached to an unlocked lesson, same restriction
    // lessonRepository.listAllVocab() applied before spaced repetition existed.
    async listDue(userId, today, limit, level = null) {
      const { results } = await db
        .prepare(
          `SELECT v.id, v.term, v.meaning, v.example, v.word_family, v.level,
                  l.id AS lesson_id, l.title AS lesson_title,
                  r.interval_days, r.repetitions
           FROM lesson_vocab lv
           JOIN vocab v ON v.id = lv.vocab_id
           JOIN lessons l ON l.id = lv.lesson_id
           LEFT JOIN vocab_review r ON r.vocab_id = v.id AND r.user_id = ?
           WHERE l.is_locked = 0 AND (r.vocab_id IS NULL OR r.due_date <= ?)
             AND (?3 IS NULL OR v.level = ?3)
           GROUP BY v.id
           ORDER BY (r.due_date IS NOT NULL) DESC, r.due_date ASC, RANDOM()
           LIMIT ?4`
        )
        .bind(userId, today, level, limit)
        .all();
      return results;
    },
    // Chi dem the DA hoc va den han (khong tinh tu moi chua hoc, keo badge luon max).
    async countDue(userId, today) {
      const row = await db
        .prepare("SELECT COUNT(*) AS n FROM vocab_review WHERE user_id = ? AND due_date <= ?")
        .bind(userId, today)
        .first();
      return row?.n ?? 0;
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
