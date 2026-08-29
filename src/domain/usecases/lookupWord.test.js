import test from "node:test";
import assert from "node:assert/strict";
import { lookupWord, getWordExamples, isWordSaved, saveLookedUpWord, LOOKUP_WORD_TAG } from "./lookupWord.js";

const WORD = { term: "ticket", type: "noun", meaning: "vé", example: "A ticket.", synonyms: [], antonyms: [] };

function deps(overrides = {}) {
  return {
    wordLookupPort: { lookup: async () => ({ ...WORD }) },
    wordLookupCacheRepository: { get: async () => null, put: async () => {} },
    dictionaryPort: { lookup: async () => ({ audioUrl: "https://a.mp3", synonyms: ["pass"], antonyms: ["ban"] }) },
    ...overrides
  };
}

test("lookupWord: cache hit thi tra ngay, khong goi AI", async () => {
  let aiCalls = 0;
  const d = deps({
    wordLookupPort: { lookup: async () => { aiCalls++; return WORD; } },
    wordLookupCacheRepository: { get: async () => ({ ...WORD, audioUrl: "" }), put: async () => {} }
  });
  const res = await lookupWord({ term: " Ticket " }, d);
  assert.equal(res.term, "ticket");
  assert.equal(aiCalls, 0);
});

test("lookupWord: cache miss thi merge AI + tu dien roi cache lai", async () => {
  const puts = [];
  const d = deps({
    wordLookupCacheRepository: { get: async () => null, put: async (key, word) => puts.push([key, word]) }
  });
  const res = await lookupWord({ term: "Ticket" }, d);
  assert.equal(res.audioUrl, "https://a.mp3");
  assert.deepEqual(res.synonyms, ["pass"]);
  assert.deepEqual(res.antonyms, ["ban"]);
  assert.equal(puts[0][0], "ticket");
});

test("lookupWord: AI da co synonyms thi giu cua AI, khong lay cua tu dien", async () => {
  const d = deps({
    wordLookupPort: { lookup: async () => ({ ...WORD, synonyms: ["coupon"], antonyms: ["x"] }) }
  });
  const res = await lookupWord({ term: "ticket" }, d);
  assert.deepEqual(res.synonyms, ["coupon"]);
  assert.deepEqual(res.antonyms, ["x"]);
});

test("lookupWord: tu dien loi hoac cache loi thi van tra ket qua AI", async () => {
  const d = deps({
    wordLookupCacheRepository: {
      get: async () => { throw new Error("no table"); },
      put: async () => { throw new Error("no table"); }
    },
    dictionaryPort: { lookup: async () => { throw new Error("api down"); } }
  });
  const res = await lookupWord({ term: "ticket" }, d);
  assert.equal(res.meaning, "vé");
  assert.equal(res.audioUrl, "");
  assert.deepEqual(res.synonyms, []);
});

test("getWordExamples: cache hit (ke ca rong) thi khong goi nguon", async () => {
  let calls = 0;
  const d = {
    exampleSentencesPort: { search: async () => { calls++; return []; } },
    exampleSentencesRepository: { get: async () => [], put: async () => {} }
  };
  assert.deepEqual(await getWordExamples({ term: "ticket" }, d), { examples: [] });
  assert.equal(calls, 0);
});

test("getWordExamples: cache miss thi goi nguon va luu lai theo key thuong", async () => {
  const puts = [];
  const examples = [{ en: "A.", vi: "a." }];
  const d = {
    exampleSentencesPort: { search: async () => examples },
    exampleSentencesRepository: { get: async () => null, put: async (term, ex) => puts.push([term, ex]) }
  };
  assert.deepEqual(await getWordExamples({ term: " Ticket " }, d), { examples });
  assert.deepEqual(puts, [["ticket", examples]]);
});

test("getWordExamples: nguon loi / cache loi thi tra rong, khong throw", async () => {
  const d = {
    exampleSentencesPort: { search: async () => { throw new Error("down"); } },
    exampleSentencesRepository: { get: async () => { throw new Error("no table"); }, put: async () => {} }
  };
  assert.deepEqual(await getWordExamples({ term: "ticket" }, d), { examples: [] });
});

test("isWordSaved trim term truoc khi hoi repo", async () => {
  const d = { savedVocabRepository: { isTermSaved: async (userId, term) => userId === "u1" && term === "ticket" } };
  assert.equal(await isWordSaved({ userId: "u1", term: " ticket " }, d), true);
});

test("saveLookedUpWord luu tu kem tag va ghi nhan hoat dong hoc", async () => {
  const saved = [];
  const d = {
    savedVocabRepository: { saveGeneratedWord: async (userId, word, tag) => saved.push([userId, word.term, tag]) },
    userRepository: {
      recordActivityDay: async () => {},
      listActivityDays: async () => [],
      updateStreak: async () => {}
    }
  };
  await saveLookedUpWord({ userId: "u1", word: WORD }, d);
  assert.deepEqual(saved, [["u1", "ticket", LOOKUP_WORD_TAG]]);
});
