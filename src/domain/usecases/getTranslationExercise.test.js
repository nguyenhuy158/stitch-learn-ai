import { test } from "node:test";
import assert from "node:assert/strict";
import { getTranslationExercise, AI_WORD_TAG } from "./getTranslationExercise.js";

const vocabRepo = { pickRandomVocab: async () => [{ term: "kitchen", meaning: "nhà bếp", example: null }] };

test("luu tu moi AI goi y vao bo suu tap kem tag", async () => {
  const saved = [];
  const res = await getTranslationExercise(
    { userId: "u1" },
    {
      dailyChallengeRepository: vocabRepo,
      translationExercisePort: {
        generate: async () => ({ vietnamese: "Mẹ tôi nấu ăn.", newWord: { term: "cook", meaning: "nấu ăn" } })
      },
      savedVocabRepository: { saveGeneratedWord: async (u, w, tag) => saved.push([u, w.term, tag]) }
    }
  );
  assert.equal(res.vietnamese, "Mẹ tôi nấu ăn.");
  assert.deepEqual(saved, [["u1", "cook", AI_WORD_TAG]]);
});

test("loi khi luu tu moi khong lam hong bai tap", async () => {
  const res = await getTranslationExercise(
    { userId: "u1" },
    {
      dailyChallengeRepository: vocabRepo,
      translationExercisePort: { generate: async () => ({ vietnamese: "Xin chào.", newWord: { term: "hi", meaning: "chào" } }) },
      savedVocabRepository: {
        saveGeneratedWord: async () => {
          throw new Error("db down");
        }
      }
    }
  );
  assert.equal(res.vietnamese, "Xin chào.");
});
