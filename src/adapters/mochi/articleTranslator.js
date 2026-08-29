/** Dich song ngu: moi paragraph tieng Anh -> 1 cau dich tieng Viet tu nhien. */
const SCHEMA = {
  type: "object",
  properties: {
    translations: { type: "array", items: { type: "string" } }
  },
  required: ["translations"]
};

export function createMochiArticleTranslator({ askJson }) {
  return {
    async translate({ story, paragraphs }) {
      const prompt = `Translate this English news article ("${story}") to natural Vietnamese for English learners.
Translate EACH paragraph separately, keeping the same order. Return exactly ${paragraphs.length} translations.

${paragraphs.map((p, i) => `[${i + 1}] ${p}`).join("\n")}

Return JSON only: { "translations": ["...", ...] }`;
      const parsed = await askJson(prompt, SCHEMA, { label: "Mochi article translate error:" });
      const translations = (parsed.translations || []).map((t) => String(t || "").trim());
      if (translations.length !== paragraphs.length || translations.some((t) => !t)) {
        throw new Error("Malformed article translation response");
      }
      return translations;
    }
  };
}
