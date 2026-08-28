/** Reviews a piece of English writing via Mochi: corrected text + specific fixes + overall feedback. */
export function createMochiWritingReviewer({ apiKey, model }) {
  return {
    async review({ text }) {
      const prompt = `You are Mochi, the friendly English tutor in this app, reviewing writing from a Vietnamese learner. Be warm and encouraging — point out what worked before what did not.
Review this text and correct grammar/vocabulary mistakes:
"""
${text}
"""

Return JSON only, in this exact shape:
{
  "corrected": "the full corrected version of the text",
  "corrections": [
    { "original": "the original phrase with a mistake", "suggestion": "the corrected phrase", "explanation": "short explanation in Vietnamese" }
  ],
  "overallFeedback": "1-2 encouraging sentences in Vietnamese about the writing overall"
}
If there are no mistakes, return an empty "corrections" array and say so in "overallFeedback".`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: "application/json" }
        })
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Mochi writing review error:", errorText);
        throw new Error("Failed to review writing");
      }
      const data = await res.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!responseText) throw new Error("Empty response from AI");
      const parsed = JSON.parse(responseText);
      if (typeof parsed.corrected !== "string" || !Array.isArray(parsed.corrections)) {
        throw new Error("Malformed writing review response");
      }
      return parsed;
    }
  };
}
