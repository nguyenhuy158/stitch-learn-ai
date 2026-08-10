/** @returns {import("../../ports/index.js").UserRepository} */
export function createD1UserRepository(db) {
  return {
    async findById(id) {
      return db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    },
    async findByEmail(email) {
      return db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
    },
    async upsertFromSso({ id, email, name, picture }) {
      await db.prepare(
        "INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name, picture = excluded.picture"
      ).bind(id, email, name, picture).run();
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
