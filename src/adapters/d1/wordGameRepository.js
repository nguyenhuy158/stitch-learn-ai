/** @returns {import("../../ports/index.js").WordGameRepository} */
export function createD1WordGameRepository(db) {
  return {
    async listRandomByLevels(levels, limit) {
      const placeholders = levels.map(() => "?").join(",");
      const { results } = await db
        .prepare(
          `SELECT id, term, meaning FROM vocab WHERE level IN (${placeholders}) ORDER BY RANDOM() LIMIT ?`
        )
        .bind(...levels, limit)
        .all();
      return results;
    }
  };
}
