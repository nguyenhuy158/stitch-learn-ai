const FEED_URL = "https://www.newsinlevels.com/feed/";

/** Vai entity hay gap trong feed WordPress; du cho van ban tin tuc. */
function decode(text) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`));
  return m ? m[1] : "";
}

/** Loc boilerplate cuoi bai: dong gio dang, "The post ...", "You can watch ...". */
function extractParagraphs(html) {
  const out = [];
  for (const m of html.matchAll(/<p>([\s\S]*?)<\/p>/g)) {
    const text = decode(m[1].replace(/<[^>]+>/g, ""));
    if (!text) continue;
    if (/^\d{2}-\d{2}-\d{4}/.test(text)) continue;
    if (text.startsWith("The post ")) continue;
    if (text.startsWith("You can watch")) continue;
    out.push(text);
  }
  return out;
}

/** RSS WordPress cua newsinlevels: moi tin la 3 item "X - level N". */
export function parseNewsFeed(xml) {
  const articles = [];
  for (const raw of xml.split("<item>").slice(1)) {
    const title = decode(tag(raw, "title"));
    // Dau giua ten va level co the la en/em dash hoac gach ngang thuong.
    const m = title.match(/^(.*?)\s*[-–—]\s*level\s*([123])$/i);
    if (!m) continue;
    const paragraphs = extractParagraphs(tag(raw, "content:encoded"));
    if (paragraphs.length === 0) continue;
    articles.push({
      guid: decode(tag(raw, "guid")),
      story: m[1].trim(),
      level: Number(m[2]),
      title,
      category: decode(tag(raw, "category")),
      publishedAt: new Date(tag(raw, "pubDate")).toISOString(),
      sourceUrl: decode(tag(raw, "link")),
      paragraphs
    });
  }
  return articles;
}

/** Lay anh og:image va iframe audio SoundCloud tu HTML trang bai goc. */
export function parseArticleMedia(html) {
  const img = html.match(/property="og:image"\s+content="([^"]+)"/);
  const audio = html.match(/<iframe[^>]+src="(https:\/\/w\.soundcloud\.com\/player\/[^"]+)"/);
  return { imageUrl: img ? decode(img[1]) : "", audioUrl: audio ? decode(audio[1]) : "" };
}

const HEADERS = { "User-Agent": "ai-english (personal study app)" };

/** @returns {import("../../ports/index.js").NewsFeedPort} */
export function createNewsInLevelsFeed() {
  return {
    async fetchArticles() {
      const res = await fetch(FEED_URL, { headers: HEADERS });
      if (!res.ok) throw new Error(`News feed error: ${res.status}`);
      const articles = parseNewsFeed(await res.text());
      // Feed khong co anh/audio — lay tu trang bai. Loi 1 trang thi bai do chi thieu media.
      await Promise.all(
        articles.map(async (a) => {
          try {
            const page = await fetch(a.sourceUrl, { headers: HEADERS });
            Object.assign(a, page.ok ? parseArticleMedia(await page.text()) : { imageUrl: "", audioUrl: "" });
          } catch {
            a.imageUrl = "";
            a.audioUrl = "";
          }
        })
      );
      return articles;
    }
  };
}
