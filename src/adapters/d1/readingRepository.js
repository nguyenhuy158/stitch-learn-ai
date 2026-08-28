/** @returns {import("../../ports/index.js").ReadingRepository} */
export function createD1ReadingRepository(db) {
  return {
    async latestFetchedAt() {
      const row = await db.prepare("SELECT MAX(fetched_at) AS at FROM reading_articles").first();
      return row?.at || null;
    },
    async upsertArticles(articles, fetchedAt) {
      if (articles.length === 0) return;
      const stmt = db.prepare(
        `INSERT INTO reading_articles (guid, story, level, title, category, published_at, paragraphs, source_url, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(guid) DO UPDATE SET fetched_at = excluded.fetched_at`
      );
      await db.batch(
        articles.map((a) =>
          stmt.bind(a.guid, a.story, a.level, a.title, a.category, a.publishedAt, JSON.stringify(a.paragraphs), a.sourceUrl, fetchedAt)
        )
      );
    },
    async listArticles(limit) {
      const { results } = await db.prepare(
        "SELECT guid, story, level, category, published_at FROM reading_articles ORDER BY published_at DESC LIMIT ?"
      ).bind(limit).all();
      return results;
    },
    async getArticle(guid) {
      const row = await db.prepare("SELECT * FROM reading_articles WHERE guid = ?").bind(guid).first();
      if (!row) return null;
      return { ...row, paragraphs: JSON.parse(row.paragraphs) };
    }
  };
}
