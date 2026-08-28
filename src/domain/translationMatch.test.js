import { test } from "node:test";
import assert from "node:assert/strict";
import { matchTranslation } from "./translationMatch.js";

test("bo qua hoa thuong va dau cau", () => {
  const r = matchTranslation("my mother is cooking in the kitchen", "My mother is cooking in the kitchen.");
  assert.equal(r.exact, true);
  assert.equal(r.score, 1);
});

test("danh dau tu sai", () => {
  const r = matchTranslation("my mother is cooking in the kitten", "My mother is cooking in the kitchen.");
  assert.equal(r.exact, false);
  assert.deepEqual(r.words.at(-1), { word: "kitchen", ok: false });
  assert.equal(r.words.filter((w) => w.ok).length, 6);
});

test("thua tu o cuoi van tinh la sai", () => {
  const r = matchTranslation("i am happy now", "I am happy");
  assert.equal(r.exact, false);
});
