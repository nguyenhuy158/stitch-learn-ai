/**
 * Repository cho bang wikipedia_etymology (migration 0028).
 * Static lookup theo term, co TTL 30 ngay de re-fetch.
 *
 * @returns {import("../../ports/index.js").WikipediaEtymologyRepository}
 */
const TTL_DAYS = 30;

export function createD1WikipediaEtymologyRepository(db) {
  return {
    /**
     * Tra etymology theo term. Tra null neu chua cache hoac cache qua cu (>30 ngay).
     * @param {string} term
     * @returns {Promise<{etymology: string, sectionTitle: string, fetchedAt: string}|null>}
     */
    async getByTerm(term) {
      if (!term) return null;
      const key = term.trim().toLowerCase();
      const row = await db
        .prepare("SELECT term, etymology, section_title, fetched_at FROM wikipedia_etymology WHERE term = ?")
        .bind(key)
        .first();
      if (!row) return null;
      // Check TTL 30 ngay
      const fetched = new Date(row.fetched_at);
      const ageDays = (Date.now() - fetched.getTime()) / 86_400_000;
      if (ageDays > TTL_DAYS) return null;
      return {
        etymology: row.etymology,
        sectionTitle: row.section_title,
        fetchedAt: row.fetched_at
      };
    },

    /**
     * Cache etymology moi. ON CONFLICT de cap nhat neu cache cu qua han.
     * @param {{term: string, etymology: string, sectionTitle: string, fetchedAt: string}} row
     */
    async upsert(row) {
      await db
        .prepare(
          `INSERT INTO wikipedia_etymology (term, etymology, section_title, fetched_at)
             VALUES (?, ?, ?, ?)
           ON CONFLICT(term) DO UPDATE SET
             etymology = excluded.etymology,
             section_title = excluded.section_title,
             fetched_at = excluded.fetched_at`
        )
        .bind(
          row.term.trim().toLowerCase(),
          row.etymology,
          row.sectionTitle,
          row.fetchedAt
        )
        .run();
    }
  };
}
