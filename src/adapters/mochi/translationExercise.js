/** Generates a Vietnamese practice sentence and grades the learner's English translation, via Mochi. */
export function createMochiTranslationExercise({ apiKey, model }) {
  async function callMochi(prompt) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        // Tat "thinking": cau day 1 dong va bai cham ngan, thinking chi lam
        // request lau them vai giay ma khong doi ket qua.
        generationConfig: { response_mime_type: "application/json", thinkingConfig: { thinkingBudget: 0 } }
      })
    });
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Mochi translation exercise error:", errorText);
      throw new Error("Failed to call AI");
    }
    const data = await res.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) throw new Error("Empty response from AI");
    return JSON.parse(responseText);
  }

  return {
    async generate({ term, meaning, example }) {
      const prompt = `You are creating a Vietnamese-to-English translation exercise for a Vietnamese learner of English.
The learner has studied this English word: "${term}" (meaning: "${meaning}"${example ? `, example: "${example}"` : ""}).

Write ONE natural, everyday Vietnamese sentence that a Vietnamese learner would translate into English, using the meaning of this word naturally in context. Keep it short (under 20 words).

Return JSON only, in this exact shape:
{ "vietnamese": "the Vietnamese sentence" }`;
      const parsed = await callMochi(prompt);
      if (typeof parsed.vietnamese !== "string" || !parsed.vietnamese.trim()) {
        throw new Error("Malformed translation exercise response");
      }
      return parsed;
    },

    async review({ vietnamese, translation }) {
      const prompt = `You are Mochi, the friendly English tutor in this app, grading a Vietnamese learner. Be warm and encouraging. The learner was asked to translate this Vietnamese sentence into English:
"""
${vietnamese}
"""
Their translation attempt:
"""
${translation}
"""

Evaluate their translation for accuracy, grammar, and natural phrasing. Return JSON only, in this exact shape:
{
  "corrected": "the best natural English translation of the Vietnamese sentence",
  "corrections": [
    { "original": "the learner's phrase with a mistake", "suggestion": "the corrected phrase", "explanation": "short explanation in Vietnamese" }
  ],
  "overallFeedback": "1-2 encouraging sentences in Vietnamese about the translation overall"
}
If the translation has no mistakes, return an empty "corrections" array and say so in "overallFeedback".`;
      const parsed = await callMochi(prompt);
      if (typeof parsed.corrected !== "string" || !Array.isArray(parsed.corrections)) {
        throw new Error("Malformed translation review response");
      }
      return parsed;
    }
  };
}
