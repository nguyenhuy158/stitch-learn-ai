/** @returns {import("../../ports/index.js").DailyChallengeRepository} */
export function createD1DailyChallengeRepository(db) {
  return {
    async getForDay(userId, day) {
      return db.prepare("SELECT * FROM daily_challenge WHERE user_id = ? AND day = ?").bind(userId, day).first();
    },
    async markCompleted(userId, day, xpAwarded, completedAt) {
      await db
        .prepare(
          "INSERT INTO daily_challenge (user_id, day, xp_awarded, completed_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, day) DO NOTHING"
        )
        .bind(userId, day, xpAwarded, completedAt)
        .run();
    },
    async pickRandomVocab(count) {
      const { results } = await db
        .prepare(
          `SELECT v.id, v.term, v.meaning FROM vocab v
           JOIN lesson_vocab lv ON lv.vocab_id = v.id
           JOIN lessons l ON l.id = lv.lesson_id
           WHERE l.is_locked = 0
           GROUP BY v.id
           ORDER BY RANDOM()
           LIMIT ?`
        )
        .bind(count)
        .all();
      return results;
    }
  };
}
