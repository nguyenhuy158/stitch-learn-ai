/** Generates an original grammar explanation for a lesson topic via Mochi, as structured JSON. */
const SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          explanation: { type: "string" },
          examples: { type: "array", items: { type: "string" } }
        },
        required: ["heading", "explanation", "examples"]
      }
    }
  },
  required: ["summary", "sections"]
};

export function createMochiGrammarContentGenerator({ askJson }) {
  return {
    async generate({ title, subTitle }) {
      const prompt = `You are writing an English grammar lesson for Vietnamese learners, for the grammar point titled "${title}" (category: ${subTitle || ""}).
Write your own original explanation of this grammar point -- do not quote or paraphrase any specific textbook. Keep it clear and practical for intermediate learners.

Return JSON only, in this exact shape:
{
  "summary": "1-2 sentence overview in Vietnamese of when/why to use this grammar point",
  "sections": [
    { "heading": "short heading for this part (Vietnamese, can be empty string if only one section)", "explanation": "explanation in Vietnamese, plain sentences, no markdown", "examples": ["natural English example sentence", "another English example sentence"] }
  ]
}
Include 2 to 4 sections, each with 2 to 4 examples.`;
      const parsed = await askJson(prompt, SCHEMA, { label: "Mochi grammar content generation error:" });
      if (!Array.isArray(parsed.sections)) throw new Error("Malformed grammar content response");
      return parsed;
    }
  };
}
