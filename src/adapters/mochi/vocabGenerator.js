/** Generates a vocabulary list for a lesson topic via Mochi, as structured JSON. */
const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: { term: { type: "string" }, meaning: { type: "string" }, example: { type: "string" } },
        required: ["term", "meaning", "example"]
      }
    }
  },
  required: ["items"]
};

export function createMochiVocabGenerator({ askJson }) {
  return {
    async generate({ title, subTitle, count = 8 }) {
      const prompt = `You are building an English-learning app for Vietnamese speakers.
Topic: "${title}" (${subTitle || ""}).
Generate exactly ${count} useful English words or short phrases for this topic.

Return JSON only, in this exact shape:
{
  "items": [
    { "term": "English word or phrase", "meaning": "Vietnamese meaning", "example": "One natural English example sentence using the term" }
  ]
}`;
      const parsed = await askJson(prompt, SCHEMA, { label: "Mochi vocab generation error:" });
      if (!Array.isArray(parsed.items)) throw new Error("Malformed vocab response");
      return parsed.items;
    }
  };
}
