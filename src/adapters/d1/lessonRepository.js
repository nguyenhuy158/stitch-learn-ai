/** @returns {import("../../ports/index.js").LessonRepository} */
export function createD1LessonRepository(db) {
  return {
    async listAll() {
      const { results } = await db.prepare("SELECT * FROM lessons ORDER BY sort_order ASC").all();
      return results;
    },
    async findById(id) {
      return db.prepare("SELECT * FROM lessons WHERE id = ?").bind(id).first();
    },
    async listVocab(lessonId) {
      const { results } = await db.prepare(
        "SELECT term, meaning, example FROM lesson_vocab WHERE lesson_id = ? ORDER BY sort_order ASC"
      ).bind(lessonId).all();
      return results;
    },
    async saveVocab(lessonId, items) {
      const statements = items.map((item, index) =>
        db.prepare(
          "INSERT INTO lesson_vocab (lesson_id, term, meaning, example, sort_order) VALUES (?, ?, ?, ?, ?)"
        ).bind(lessonId, item.term, item.meaning, item.example ?? null, index)
      );
      await db.batch(statements);
    }
  };
}
