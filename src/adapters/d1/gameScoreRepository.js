/** @returns {import("../../ports/index.js").GameScoreRepository} */
export function createD1GameScoreRepository(db) {
  return {
    async record(userId, game, score, createdAt) {
      await db
        .prepare("INSERT INTO game_scores (user_id, game, score, created_at) VALUES (?, ?, ?, ?)")
        .bind(userId, game, score, createdAt)
        .run();
    },
    async bestForUser(userId, game) {
      const row = await db
        .prepare("SELECT MAX(score) AS best FROM game_scores WHERE user_id = ? AND game = ?")
        .bind(userId, game)
        .first();
      return row?.best ?? 0;
    },
    /** Top score per user (their personal best), ranked — not every raw play. */
    async topScores(game, limit) {
      const { results } = await db
        .prepare(
          `SELECT u.id AS user_id, u.name, MAX(gs.score) AS best
           FROM game_scores gs
           JOIN users u ON u.id = gs.user_id
           WHERE gs.game = ?
           GROUP BY gs.user_id
           ORDER BY best DESC
           LIMIT ?`
        )
        .bind(game, limit)
        .all();
      return results;
    }
  };
}
