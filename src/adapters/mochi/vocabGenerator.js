/** Generates a vocabulary list for a lesson topic via Mochi, as structured JSON. */
export function createMochiVocabGenerator({ apiKey, model }) {
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
        console.error("Mochi vocab generation error:", errorText);
        throw new Error("Failed to generate lesson content");
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from AI");
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.items)) throw new Error("Malformed vocab response");
      return parsed.items;
    }
  };
}
