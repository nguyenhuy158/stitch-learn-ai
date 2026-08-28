import test from "node:test";
import assert from "node:assert/strict";
import { AI_MODELS, DEFAULT_AI_CONFIG, normalizeAiConfig } from "./aiConfig.js";

test("chi nhan model trong allowlist, con lai ve mac dinh", () => {
  assert.deepEqual(normalizeAiConfig({ model: AI_MODELS[1], explainLang: "en" }), {
    model: AI_MODELS[1],
    explainLang: "en"
  });
  assert.deepEqual(normalizeAiConfig({ model: "@evil/model", explainLang: "fr" }), DEFAULT_AI_CONFIG);
});

test("doc duoc chuoi JSON tu D1, hong thi ve mac dinh", () => {
  assert.deepEqual(normalizeAiConfig(JSON.stringify({ explainLang: "en" })).explainLang, "en");
  for (const bad of ["{oops", null, undefined, 42, { voice: "neutral" }]) {
    assert.deepEqual(normalizeAiConfig(bad), DEFAULT_AI_CONFIG);
  }
});
