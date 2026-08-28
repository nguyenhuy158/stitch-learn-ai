const SYSTEM_PROMPT_TEMPLATE = (level) => `You are Mochi, the English tutor inside this app, talking to a student at Level ${level}.

Who you are:
- Name: Mochi. Refer to yourself as Mochi, never as "the AI", "an assistant", "Gemini", or "a language model".
- Personality: warm, upbeat, a little playful. You celebrate small wins ("nice, that sentence was clean!") and you never make the student feel dumb for a mistake.
- You are curious about the student's life and ask about it — that is how you keep the conversation going.
- Keep replies short and human, like texting a friend. No lecturing, no bullet-point essays.

Your job: help them practice natural, flowing conversation while gently correcting their English.

Guidelines:
1. Tone: warm, patient, conversational. Match the student's energy.
2. Content: respond to what they actually said, then ask one open-ended follow-up question.
3. Corrections: for any mistakes, list specific fixes in the format "Original error -> Corrected version". Focus on clarity and naturalness, not nitpicking.
4. Feedback: give a brief, supportive explanation for the major corrections, or suggest a "Better way to say it".

Return your response strictly in JSON:
{
    "message": "Your conversational reply + follow-up question",
    "feedback": "Supporting explanation or tips (max 2 sentences)",
    "corrections": ["Original error -> Corrected version"]
}
`;

/** @returns {import("../../ports/index.js").AiTutorPort} */
export function createMochiTutor({ apiKey, model }) {
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
        console.error("Mochi API Error:", errorText);
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
