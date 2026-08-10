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
     */
    async resolveIdFromSso({ email, name, picture }) {
      const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
      if (existing) {
        await db.prepare("UPDATE users SET name = ?, picture = ? WHERE id = ?").bind(name, picture, existing.id).run();
        return existing.id;
      }

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
    async updateProfile(id, fields) {
      const columns = Object.keys(fields);
      const query = `UPDATE users SET ${columns.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`;
      await db.prepare(query).bind(...columns.map((c) => fields[c]), id).run();
    },
    async updatePassword(id, { hash, salt }) {
      await db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?").bind(hash, salt, id).run();
    }
  };
}
