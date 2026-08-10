const SYSTEM_PROMPT_TEMPLATE = (level) => `You are an encouraging English tutor interacting with a student (Level ${level}).
                Your goal is to help them practice conversation.
                1. Respond naturally to their message.
                2. Provide helpful feedback if they make grammar mistakes.
                3. Suggest better vocabulary if applicable.

                Return your response in JSON format:
                {
                    "message": "Your reply here",
                    "feedback": "Optional grammar/vocab feedback",
                    "corrections": ["correction 1", "correction 2"]
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
