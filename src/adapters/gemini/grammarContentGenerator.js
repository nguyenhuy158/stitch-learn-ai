/** Generates an original grammar explanation for a lesson topic via Gemini, as structured JSON. */
export function createGeminiGrammarContentGenerator({ apiKey, model }) {
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
        console.error("Gemini grammar content generation error:", errorText);
        throw new Error("Failed to generate lesson content");
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from AI");
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.sections)) throw new Error("Malformed grammar content response");
      return parsed;
    }
  };
}
