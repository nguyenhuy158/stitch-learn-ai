import { explainLanguageName, normalizeAiConfig } from "../../domain/aiConfig.js";

/** Reviews a piece of English writing via Mochi: corrected text + specific fixes + overall feedback. */
const SCHEMA = {
  type: "object",
  properties: {
    corrected: { type: "string" },
    corrections: {
      type: "array",
      items: {
        type: "object",
        properties: { original: { type: "string" }, suggestion: { type: "string" }, explanation: { type: "string" } },
        required: ["original", "suggestion", "explanation"]
      }
    },
    overallFeedback: { type: "string" }
  },
  required: ["corrected", "corrections", "overallFeedback"]
};

export function createMochiWritingReviewer({ askJson }) {
  return {
    async review({ text, config }) {
      const { model, explainLang } = normalizeAiConfig(config);
      const lang = explainLanguageName(explainLang);
      const prompt = `You are Mochi, the friendly English tutor in this app, reviewing writing from a Vietnamese learner. Be warm and encouraging — point out what worked before what did not.
Review this text and correct grammar/vocabulary mistakes:
"""
${text}
"""

Return JSON only, in this exact shape:
{
  "corrected": "the full corrected version of the text",
  "corrections": [
    { "original": "the original phrase with a mistake", "suggestion": "the corrected phrase", "explanation": "short explanation in ${lang}" }
  ],
  "overallFeedback": "1-2 encouraging sentences in ${lang} about the writing overall"
}
If there are no mistakes, return an empty "corrections" array and say so in "overallFeedback".`;
      const parsed = await askJson(prompt, SCHEMA, { label: "Mochi writing review error:", model });
      if (typeof parsed.corrected !== "string" || !Array.isArray(parsed.corrections)) {
        throw new Error("Malformed writing review response");
      }
      return parsed;
    }
  };
}
