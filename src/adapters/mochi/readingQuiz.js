/** Sinh quiz doc hieu 4 cau cho mot bai doc. */
const SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answer: { type: "integer" },
          explanation: { type: "string" }
        },
        required: ["question", "choices", "answer", "explanation"]
      }
    }
  },
  required: ["questions"]
};

export function createMochiReadingQuiz({ askJson }) {
  return {
    async generate({ story, level, paragraphs }) {
      const prompt = `You write reading-comprehension quizzes for Vietnamese learners of English.
The article below is written at difficulty level ${level} of 3 (1 = beginner).

Article: "${story}"
${paragraphs.join("\n")}

Write exactly 4 multiple-choice questions that test understanding of THIS article
(facts, vocabulary in context, main idea). Keep the questions and choices in English,
matched to the article's difficulty. Each question has exactly 4 choices with ONE
correct answer. "answer" is the 0-based index of the correct choice.
"explanation" is one short Vietnamese sentence explaining the answer.

Return JSON only:
{ "questions": [ { "question": "...", "choices": ["...","...","...","..."], "answer": 0, "explanation": "..." } ] }`;
      const parsed = await askJson(prompt, SCHEMA, { label: "Mochi reading quiz error:" });
      const questions = (parsed.questions || []).filter(
        (q) => q.question && Array.isArray(q.choices) && q.choices.length === 4 &&
          Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4
      );
      if (questions.length === 0) throw new Error("Malformed reading quiz response");
      return questions.slice(0, 4);
    }
  };
}
