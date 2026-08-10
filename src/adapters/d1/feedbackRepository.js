/** @returns {import("../../ports/index.js").FeedbackRepository} */
export function createD1FeedbackRepository(db) {
  return {
    async create(userId, message) {
      await db.prepare("INSERT INTO feedback (user_id, message) VALUES (?, ?)").bind(userId, message).run();
    }
  };
}
