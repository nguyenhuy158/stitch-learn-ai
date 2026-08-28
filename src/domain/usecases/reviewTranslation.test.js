import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewTranslation } from "./reviewTranslation.js";

test("luu lai lan dich vao lich su", async () => {
  const saved = [];
  const result = await reviewTranslation(
    { userId: "u1", vietnamese: " Mẹ tôi nấu ăn. ", translation: " my mother cooks " },
    {
      translationExercisePort: {
        review: async () => ({ corrected: "My mother cooks.", corrections: [{}], overallFeedback: "Tốt" })
      },
      userRepository: {
        findById: async () => ({ gemini_config: null }),
        incrementXp: async () => {},
        getActivityDay: async () => null,
        recordActivityDay: async () => {}
      },
      translationRepository: { saveAttempt: async (a) => saved.push(a) }
    },
    new Date("2026-08-28T10:00:00Z")
  );
  assert.equal(result.corrected, "My mother cooks.");
  assert.equal(saved.length, 1);
  assert.equal(saved[0].vietnamese, "Mẹ tôi nấu ăn.");
  assert.equal(saved[0].translation, "my mother cooks");
  assert.equal(saved[0].correctionCount, 1);
});
