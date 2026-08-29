const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";

/** Rut gon response dictionaryapi.dev: audio mp3 doc tu + dong nghia/trai nghia. */
export function mapDictionaryResponse(entries) {
  const out = { audioUrl: "", synonyms: [], antonyms: [] };
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (!out.audioUrl) out.audioUrl = (entry.phonetics ?? []).find((p) => p.audio)?.audio ?? "";
    for (const m of entry.meanings ?? []) {
      out.synonyms.push(...(m.synonyms ?? []));
      out.antonyms.push(...(m.antonyms ?? []));
    }
  }
  out.synonyms = [...new Set(out.synonyms)].slice(0, 3);
  out.antonyms = [...new Set(out.antonyms)].slice(0, 3);
  return out;
}

/** @returns {import("../../ports/index.js").DictionaryPort} */
export function createFreeDictionary() {
  return {
    async lookup(term) {
      const res = await fetch(API_URL + encodeURIComponent(term), {
        headers: { "User-Agent": "ai-english (personal study app)" }
      });
      // 404 = tu khong co trong tu dien, khong phai loi.
      if (res.status === 404) return { audioUrl: "", synonyms: [], antonyms: [] };
      if (!res.ok) throw new Error(`Dictionary API error: ${res.status}`);
      return mapDictionaryResponse(await res.json());
    }
  };
}
