/** Lich su cac lan dich cau cua nguoi hoc. */
export function createD1TranslationRepository(db) {
  return {
    async saveAttempt({ userId, vietnamese, translation, corrected, feedback, correctionCount, createdAt }) {
      await db
        .prepare(
          `INSERT INTO translation_attempts
             (user_id, vietnamese, translation, corrected, feedback, correction_count, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .bind(userId, vietnamese, translation, corrected, feedback, correctionCount, createdAt)
        .run();
    },
    async listAttempts(userId, limit) {
      const { results } = await db
        .prepare(
          `SELECT id, vietnamese, translation, corrected, feedback, correction_count AS correctionCount, created_at AS createdAt
           FROM translation_attempts WHERE user_id = ? ORDER BY id DESC LIMIT ?`
        )
        .bind(userId, limit)
        .all();
      return results;
    }
  };
}
