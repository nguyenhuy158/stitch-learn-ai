// Adapter goi Wikipedia API de lay section "Etymology" cua 1 tu.
// Khong can API key, free, CORS-friendly khi goi tu Worker server-side.
//
// Flow:
//   1. GET /w/api.php?action=parse&page=<term>&prop=sections&format=json
//      -> list sections, tim section co line ~ "Etymology"
//   2. GET /w/api.php?action=parse&page=<term>&prop=wikitext&section=N&format=json
//      -> lay wikitext content
//   3. Strip wiki markup: [[link|text]] -> "text", [[link]] -> "link",
//      {{template}} -> "", <ref>...</ref> -> "", '''bold''' -> "bold", ''italic'' -> "italic"
//   4. Trim whitespace, cap 500 ky tu

const SECTIONS_URL = "https://en.wikipedia.org/w/api.php?action=parse&page=";
const CONTENT_URL = "https://en.wikipedia.org/w/api.php?action=parse&page=";
const COMMON_PARAMS = "&format=json&redirects=1";

/**
 * Strip MediaWiki markup thanh plain text.
 * Xu ly theo thu tu uu tien de tranh chen nhau:
 *   1. <ref name="..." /> hoac <ref>...</ref> -> ""
 *   2. {{template|arg1|arg2}} -> "" (template phuc tap, bo luon)
 *   3. [[link|display]] -> "display", [[link]] -> "link"
 *   4. '''bold''' / ''italic'' -> "bold" / "italic"
 *   5. ==Heading== -> "" (khong can heading trong popup)
 *   6. Collapse whitespace
 */
function stripWikitext(text) {
  if (!text) return "";
  return text
    .replace(/<ref[^>]*\/?>|<ref[^>]*>[\s\S]*?<\/ref>/g, "")
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'''([^']+)'''/g, "$1")
    .replace(/''([^']+)''/g, "$1")
    .replace(/==+[^=]+==+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** @returns {import("../../ports/index.js").WikipediaEtymologyPort} */
export function createWikipediaEtymology() {
  return {
    async lookup(term) {
      const title = term.trim();
      if (!title) return { etymology: "", sectionTitle: "" };

      // Buoc 1: tim section "Etymology" (hoac "Origin", "History")
      const sectionsUrl = `${SECTIONS_URL}${encodeURIComponent(title)}&prop=sections${COMMON_PARAMS}`;
      const sectionsRes = await fetch(sectionsUrl, {
        headers: { "User-Agent": "ai-english (https://en.huyab.click)" }
      });
      if (!sectionsRes.ok) return { etymology: "", sectionTitle: "" };
      const sectionsData = await sectionsRes.json();
      const sections = sectionsData.parse?.sections ?? [];
      // Uu tien "Etymology", fallback "Origin"/"History" neu khong co.
      const target = sections.find((s) => /^etymology$/i.test(s.line))
        ?? sections.find((s) => /^(origin|history)$/i.test(s.line));
      if (!target) return { etymology: "", sectionTitle: "" };

      // Buoc 2: lay content section do
      const contentUrl = `${CONTENT_URL}${encodeURIComponent(title)}&prop=wikitext&section=${target.index}${COMMON_PARAMS}`;
      const contentRes = await fetch(contentUrl, {
        headers: { "User-Agent": "ai-english (https://en.huyab.click)" }
      });
      if (!contentRes.ok) return { etymology: "", sectionTitle: target.line };
      const contentData = await contentRes.json();
      const wikitext = contentData.parse?.wikitext?.["*"] ?? "";

      const etymology = stripWikitext(wikitext).slice(0, 500);
      return { etymology, sectionTitle: target.line };
    }
  };
}
