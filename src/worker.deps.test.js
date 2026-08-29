/**
 * Moi usecase nhan deps qua destructuring nen thieu 1 key trong buildDeps
 * khong he bao loi luc build — chi no ra 500 o prod (da xay ra 2 lan:
 * readingRepository, roi savedVocab/translation/exampleSentences).
 * Test doc tinh (khong chay worker) de bat truoc khi deploy.
 */
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const USECASE_DIR = "src/domain/usecases";

test("buildDeps cung cap moi dep ma usecase can", () => {
  const worker = readFileSync("src/worker.js", "utf8");
  const block = worker.slice(worker.indexOf("function buildDeps"), worker.indexOf("export default"));
  const provided = new Set([...block.matchAll(/^ {4}(\w+):/gm)].map((m) => m[1]));

  const needed = new Set();
  for (const file of readdirSync(USECASE_DIR)) {
    if (!file.endsWith(".js") || file.endsWith(".test.js")) continue;
    const src = readFileSync(join(USECASE_DIR, file), "utf8");
    for (const m of src.matchAll(/export async function \w+\([^)]*?,\s*\{([^}]*)\}/gs)) {
      for (const raw of m[1].split(",")) {
        const name = raw.trim().split(":")[0].split("=")[0].trim();
        if (name) needed.add(name);
      }
    }
  }

  const missing = [...needed].filter((n) => !provided.has(n)).sort();
  assert.deepStrictEqual(missing, [], `buildDeps thieu: ${missing.join(", ")}`);
});
