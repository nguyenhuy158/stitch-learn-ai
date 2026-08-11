/** @returns {import("../../ports/index.js").UserRepository} */
export function createD1UserRepository(db) {
  return {
    async findById(id) {
      return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    },
    async findByEmail(email) {
      return db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    },
    /**
     * Resolves SSO claims to this app's internal user id, keyed on email —
     * not `sub`. The SSO issuer's `sub` is its own internal id, unrelated to
     * whatever id a user already has here (e.g. from the old direct-Google
     * flow, or from password signup). Inserting a new row keyed on `sub`
     * would violate the UNIQUE constraint on `email` for any returning user.
     *
     * Existing users are NOT overwritten with the SSO's name/picture on every
     * re-login — this app is the source of truth for those once a user has
     * an account here, so a stale/different name at the SSO issuer doesn't
     * clobber a profile edit made via /api/user/update.
     */
    async resolveIdFromSso({ email, name, picture }) {
      const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
      if (existing) return existing.id;

      const id = crypto.randomUUID();
      await db.prepare(
        "INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO NOTHING"
      ).bind(id, email, name, picture).run();

      // Two first requests from the same person can race; the loser reads
      // back the winner's row instead of creating a second user.
      const row = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
      if (!row) throw new Error("Failed to resolve user id for SSO session");
      return row.id;
    },
    async updateStreak(id, { streak, last_active_date }) {
      await db.prepare("UPDATE users SET streak = ?, last_active_date = ? WHERE id = ?").bind(streak, last_active_date, id).run();
    },
    async recordActivityDay(id, day) {
      await db.prepare("INSERT OR IGNORE INTO activity_days (user_id, day) VALUES (?, ?)").bind(id, day).run();
    },
    /** Days the user actually learned on, newest first. */
    async listActivityDays(id, limit) {
      const { results } = await db
        .prepare("SELECT day FROM activity_days WHERE user_id = ? ORDER BY day DESC LIMIT ?")
        .bind(id, limit)
        .all();
      return results.map((row) => row.day);
    },
    async updateProfile(id, fields) {
      const columns = Object.keys(fields);
      const query = `UPDATE users SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`;
      await db.prepare(query).bind(...columns.map((c) => fields[c]), id).run();
    },
    async incrementXp(id, amount) {
      await db.prepare("UPDATE users SET xp = COALESCE(xp, 0) + ? WHERE id = ?").bind(amount, id).run();
    },
    /** Users who haven't logged any activity_days row for `day` yet — the streak-reminder cron's target list. */
    async listInactiveToday(day) {
      const { results } = await db
        .prepare(
          `SELECT u.id, u.email, u.name, u.streak FROM users u
           WHERE u.email IS NOT NULL
             AND NOT EXISTS (SELECT 1 FROM activity_days a WHERE a.user_id = u.id AND a.day = ?)`
        )
        .bind(day)
        .all();
      return results;
    },
    async listRankings(limit) {
      const { results } = await db.prepare(
        "SELECT id, name, xp, streak FROM users ORDER BY xp DESC, streak DESC LIMIT ?"
      ).bind(limit).all();
      return results;
    },
    async getRank(id) {
      const user = await db.prepare("SELECT xp FROM users WHERE id = ?").bind(id).first();
      if (!user) return null;
      const row = await db
        .prepare("SELECT COUNT(*) + 1 AS rank FROM users WHERE xp > ?")
        .bind(user.xp || 0)
        .first();
      return row.rank;
    }
  };
}
