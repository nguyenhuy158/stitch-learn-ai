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
        `SELECT v.id, v.term, v.type, v.pronounce, v.meaning, v.example, v.word_family
         FROM lesson_vocab lv JOIN vocab v ON v.id = lv.vocab_id
         WHERE lv.lesson_id = ? ORDER BY lv.sort_order ASC`
      ).bind(lessonId).all();
      return results;
    },
    // vocab.term is globally unique now (a term can be shared across lessons),
    // so a new term upserts into `vocab` first, then gets linked to this
    // lesson. ON CONFLICT DO NOTHING on the link: two concurrent first-requests
    // for the same lesson can both decide to generate, but only one's links survive.
    async saveVocab(lessonId, items) {
      for (const [index, item] of items.entries()) {
        await db.prepare(
          "INSERT INTO vocab (term, meaning, example) VALUES (?, ?, ?) ON CONFLICT(term) DO NOTHING"
        ).bind(item.term, item.meaning, item.example ?? null).run();
        const vocabRow = await db.prepare("SELECT id FROM vocab WHERE term = ?").bind(item.term).first();
        await db.prepare(
          "INSERT INTO lesson_vocab (lesson_id, vocab_id, sort_order) VALUES (?, ?, ?) ON CONFLICT(lesson_id, vocab_id) DO NOTHING"
        ).bind(lessonId, vocabRow.id, index).run();
      }
    },
    // Flashcards only ever show vocab that's already been generated (visiting
    // a lesson at least once) — this never triggers a new Gemini call, and
    // never includes locked lessons.
    async listAllVocab() {
      const { results } = await db
        .prepare(
          `SELECT v.id, v.term, v.meaning, v.example, v.word_family, l.id AS lesson_id, l.title AS lesson_title
           FROM lesson_vocab lv
           JOIN vocab v ON v.id = lv.vocab_id
           JOIN lessons l ON l.id = lv.lesson_id
           WHERE l.is_locked = 0
           ORDER BY l.sort_order ASC, lv.sort_order ASC`
        )
        .all();
      return results;
    },
    async saveContent(lessonId, content) {
      await db.prepare("UPDATE lessons SET content = ? WHERE id = ?").bind(content, lessonId).run();
    }
  };
}
