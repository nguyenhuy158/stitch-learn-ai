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
    }
  };
}
