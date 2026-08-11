const BATCH_SIZE = 25;
const VALID_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MODEL = "@cf/meta/llama-3.1-8b-instruct-fast";

/**
 * One-off backfill: assigns a CEFR level (A1..C2) to every vocab row that
 * doesn't have one yet, via Workers AI (no external API key). Processes
 * everything unleveled in one request, in small batches so a bad AI reply
 * only drops one batch instead of the whole run.
 */
export async function classifyVocabLevels({ env }) {
  const { results: rows } = await env.DB.prepare("SELECT id, term, meaning FROM vocab WHERE level IS NULL").all();
  let classified = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    try {
      const levels = await classifyBatch(env.AI, batch);
      const stmts = batch
        .filter((w) => VALID_LEVELS.includes(levels[w.term]))
        .map((w) => env.DB.prepare("UPDATE vocab SET level = ? WHERE id = ?").bind(levels[w.term], w.id));
      if (stmts.length) await env.DB.batch(stmts);
      classified += stmts.length;
      failed += batch.length - stmts.length;
    } catch (error) {
      console.error("Batch classify failed:", error);
      failed += batch.length;
    }
  }

  return { total: rows.length, classified, failed };
}

async function classifyBatch(ai, words) {
  const prompt = `You are labeling English words with their CEFR level (A1, A2, B1, B2, C1, or C2) for a Vietnamese learner app.
Words (with Vietnamese meaning for context):
${words.map((w) => `- ${w.term}: ${w.meaning}`).join("\n")}

Return JSON only, in this exact shape, one entry per word using the exact term as key:
{ "word1": "A1", "word2": "B2" }`;

  const response = await ai.run(MODEL, {
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });
  const text = typeof response.response === "string" ? response.response : JSON.stringify(response.response);
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON in AI response");
  return JSON.parse(match[0]);
}
