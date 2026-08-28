import { ValidationError } from "../errors.js";

/** Feed ra tin moi vai lan/ngay; 6 tieng refresh mot lan la du. */
const STALE_MS = 6 * 60 * 60 * 1000;

/** Danh sach tin, moi tin gom 3 level. Feed hong thi van tra cache cu. */
export async function listReadingStories(_, { readingRepository, newsFeedPort }, now = new Date()) {
  const latest = await readingRepository.latestFetchedAt();
  if (!latest || now.getTime() - new Date(latest).getTime() > STALE_MS) {
    try {
      const articles = await newsFeedPort.fetchArticles();
      await readingRepository.upsertArticles(articles, now.toISOString());
    } catch (err) {
      console.error("News feed refresh error:", err);
    }
  }
  const rows = await readingRepository.listArticles(90);
  const byStory = new Map();
  for (const row of rows) {
    let story = byStory.get(row.story);
    if (!story) {
      story = { story: row.story, category: row.category, publishedAt: row.published_at, levels: [] };
      byStory.set(row.story, story);
    }
    story.levels.push({ guid: row.guid, level: row.level });
  }
  for (const story of byStory.values()) story.levels.sort((a, b) => a.level - b.level);
  return { stories: [...byStory.values()] };
}

export async function getReadingArticle({ guid }, { readingRepository }) {
  if (!guid) throw new ValidationError("Missing article id");
  const article = await readingRepository.getArticle(guid);
  if (!article) throw new ValidationError("Article not found");
  return {
    guid: article.guid,
    story: article.story,
    level: article.level,
    category: article.category,
    publishedAt: article.published_at,
    sourceUrl: article.source_url,
    paragraphs: article.paragraphs
  };
}
