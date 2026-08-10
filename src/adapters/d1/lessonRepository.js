/** @returns {import("../../ports/index.js").LessonRepository} */
export function createD1LessonRepository(db) {
  return {
    async listAll() {
      const { results } = await db.prepare("SELECT * FROM lessons ORDER BY sort_order ASC").all();
      return results;
    }
  };
}
