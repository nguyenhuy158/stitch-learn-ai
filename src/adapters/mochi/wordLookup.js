/** Tra cuu 1 tu tieng Anh: nghia, loai tu, vi du, dong nghia / trai nghia. */
const SCHEMA = {
  type: "object",
  properties: {
    term: { type: "string" },
    type: { type: "string" },
    meaning: { type: "string" },
    example: { type: "string" },
    synonyms: { type: "array", items: { type: "string" } },
    antonyms: { type: "array", items: { type: "string" } }
  },
  required: ["term", "type", "meaning", "example", "synonyms", "antonyms"]
};

export function createMochiWordLookup({ askJson }) {
  return {
    async lookup({ term, context }) {
      const prompt = `You are a dictionary for Vietnamese learners of English.
Explain the English word "${term}"${context ? ` as used in this sentence: "${context}"` : ""}.

Return JSON only, in this exact shape:
{
  "term": "the base (dictionary) form of the word",
  "type": "part of speech in English, e.g. noun, verb, adjective",
  "meaning": "Vietnamese meaning, short",
  "example": "one short natural English example sentence",
  "synonyms": ["up to 3 English synonyms"],
  "antonyms": ["up to 3 English antonyms, empty array if none"]
}`;
      const parsed = await askJson(prompt, SCHEMA, { label: "Mochi word lookup error:" });
      if (typeof parsed.meaning !== "string") throw new Error("Malformed word lookup response");
      return {
        term: parsed.term || term,
        type: parsed.type || "",
        meaning: parsed.meaning,
        example: parsed.example || "",
        synonyms: Array.isArray(parsed.synonyms) ? parsed.synonyms.slice(0, 3) : [],
        antonyms: Array.isArray(parsed.antonyms) ? parsed.antonyms.slice(0, 3) : []
      };
    }
  };
}
