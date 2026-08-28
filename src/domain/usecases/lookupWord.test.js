import test from "node:test";
import assert from "node:assert/strict";
import { lookupWord } from "./lookupWord.js";

const WORD = { term: "coat", type: "noun", meaning: "áo khoác", example: "A warm coat.", synonyms: [], antonyms: [] };

test("tra cache truoc, khong goi AI", async () => {
  let called = 0;
  const result = await lookupWord(
    { term: "Coat" },
    {
      wordLookupPort: { lookup: async () => (called++, WORD) },
      wordLookupCacheRepository: { get: async (key) => (assert.equal(key, "coat"), WORD), put: async () => {} }
    }
  );
  assert.equal(called, 0);
  assert.deepEqual(result, WORD);
});

test("cache miss thi goi AI roi luu lai", async () => {
  const saved = [];
  const result = await lookupWord(
    { term: "coat" },
    {
      wordLookupPort: { lookup: async () => WORD },
      wordLookupCacheRepository: { get: async () => null, put: async (w) => saved.push(w) }
    }
  );
  assert.deepEqual(result, WORD);
  assert.deepEqual(saved, [WORD]);
});
