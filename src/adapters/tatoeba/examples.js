const API_URL = "https://api.tatoeba.org/unstable/sentences";

/** Rut gon response Tatoeba thanh [{en, vi}], chi lay cau co ban dich Viet. */
export function mapTatoebaResponse(data, limit = 4) {
  const out = [];
  for (const s of data?.data ?? []) {
    const vi = (s.translations ?? []).find((t) => t.lang === "vie");
    if (!vi) continue;
    out.push({ en: s.text, vi: vi.text });
    if (out.length >= limit) break;
  }
  return out;
}

/** @returns {import("../../ports/index.js").ExampleSentencesPort} */
export function createTatoebaExamples() {
  return {
    async search(term) {
      const url = `${API_URL}?lang=eng&q=${encodeURIComponent(term)}&trans%3Alang=vie&sort=relevance&limit=8`;
      const res = await fetch(url, { headers: { "User-Agent": "ai-english (personal study app)" } });
      if (!res.ok) throw new Error(`Tatoeba error: ${res.status}`);
      return mapTatoebaResponse(await res.json());
    }
  };
}
