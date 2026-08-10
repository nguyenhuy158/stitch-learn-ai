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
    // ON CONFLICT DO NOTHING + a UNIQUE(lesson_id, term) index: two concurrent
    // first-requests for the same lesson can both decide to generate, but
    // only one's rows survive instead of duplicating every term.
    async saveVocab(lessonId, items) {
      const statements = items.map((item, index) =>
        db.prepare(
          "INSERT INTO lesson_vocab (lesson_id, term, meaning, example, sort_order) VALUES (?, ?, ?, ?, ?) ON CONFLICT(lesson_id, term) DO NOTHING"
        ).bind(lessonId, item.term, item.meaning, item.example ?? null, index)
      );
      await db.batch(statements);
    },
    // Flashcards only ever show vocab that's already been generated (visiting
    // a lesson at least once) — this never triggers a new Gemini call, and
    // never includes locked lessons.
    async listAllVocab() {
      const { results } = await db
        .prepare(
          `SELECT v.id, v.term, v.meaning, v.example, l.id AS lesson_id, l.title AS lesson_title
           FROM lesson_vocab v
           JOIN lessons l ON l.id = v.lesson_id
           WHERE l.is_locked = 0
           ORDER BY l.sort_order ASC, v.sort_order ASC`
        )
        .all();
      return results;
    }
  };
}
