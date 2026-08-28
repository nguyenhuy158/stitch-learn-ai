/** @returns {import("../../ports/index.js").WordLookupCacheRepository} */
export function createD1WordLookupCacheRepository(db) {
  return {
    async get(term) {
      const row = await db.prepare("SELECT * FROM word_lookups WHERE term = ?").bind(term).first();
      if (!row) return null;
      return {
        term: row.term,
        type: row.type,
        meaning: row.meaning,
        example: row.example,
        // Danh sach ngan nen luu chuoi ngan cach bang dau phay cho gon.
        synonyms: row.synonyms ? row.synonyms.split(",") : [],
        antonyms: row.antonyms ? row.antonyms.split(",") : []
      };
    },
    async put(word, createdAt) {
      await db
        .prepare(
          `INSERT INTO word_lookups (term, type, meaning, example, synonyms, antonyms, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT(term) DO NOTHING`
        )
        .bind(
          word.term,
          word.type ?? "",
          word.meaning,
          word.example ?? "",
          (word.synonyms ?? []).join(","),
          (word.antonyms ?? []).join(","),
          createdAt
        )
        .run();
    }
  };
}
