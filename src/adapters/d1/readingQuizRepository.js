/** @returns {import("../../ports/index.js").ReadingQuizRepository} */
export function createD1ReadingQuizRepository(db) {
  return {
    async get(guid) {
      const row = await db.prepare("SELECT questions FROM reading_quizzes WHERE guid = ?").bind(guid).first();
      return row ? JSON.parse(row.questions) : null;
    },
    async put(guid, questions, createdAt) {
      await db.prepare(
        "INSERT INTO reading_quizzes (guid, questions, created_at) VALUES (?, ?, ?) ON CONFLICT(guid) DO NOTHING"
      ).bind(guid, JSON.stringify(questions), createdAt).run();
    },
    async saveAttempt(userId, guid, correct, total, createdAt) {
      await db.prepare(
        "INSERT INTO reading_quiz_attempts (user_id, guid, correct, total, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(userId, guid, correct, total, createdAt).run();
    },
    async listAttempts(userId, guid, limit) {
      const { results } = await db.prepare(
        "SELECT correct, total, created_at FROM reading_quiz_attempts WHERE user_id = ? AND guid = ? ORDER BY created_at DESC, id DESC LIMIT ?"
      ).bind(userId, guid, limit).all();
      return results;
    }
  };
}
