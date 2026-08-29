/** @returns {import("../../ports/index.js").ExampleSentencesRepository} */
export function createD1ExampleSentencesRepository(db) {
  return {
    async get(term) {
      const row = await db.prepare("SELECT examples FROM example_sentences WHERE term = ?").bind(term).first();
      return row ? JSON.parse(row.examples) : null;
    },
    async put(term, examples, createdAt) {
      await db
        .prepare("INSERT INTO example_sentences (term, examples, created_at) VALUES (?, ?, ?) ON CONFLICT(term) DO NOTHING")
        .bind(term, JSON.stringify(examples), createdAt)
        .run();
    }
  };
}
