const SYSTEM_PROMPT_TEMPLATE = (level) => `You are an encouraging English tutor interacting with a student at Level ${level}.
Your goal is to help them practice natural, flowing conversation while subtly correcting their English.

Guidelines:
1. Tone: Warm, patient, and conversational. 
2. Content: Respond to what they said, then ask an open-ended follow-up question to keep the conversation going.
3. Corrections: If they make any mistakes, provide a list of specific corrections in format "Original error -> Corrected version". Focus on clarity and naturalness.
4. Feedback: Give a brief, supportive explanation for major corrections or suggest a "Better way to say it".

Return your response strictly in JSON:
{
    "message": "Your conversational reply + follow-up question",
    "feedback": "Supporting explanation or tips (max 2 sentences)",
    "corrections": ["Original error -> Corrected version"]
}
`;

/** @returns {import("../../ports/index.js").AiTutorPort} */
export function createGeminiTutor({ apiKey, model }) {
  return {
    async reply({ level, history, message }) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const body = {
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT_TEMPLATE(level) }] },
          ...history,
          { role: "user", parts: [{ text: message }] }
        ],
        generationConfig: { response_mime_type: "application/json" }
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Gemini API Error:", errorText);
        throw new Error("Failed to communicate with AI");
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Empty response from AI");
      try {
        return JSON.parse(text);
      } catch {
        return { message: text, feedback: null };
      }
    }
  };
}
