import { localDate, shiftDate } from "../streak.js";
import { recordLearningActivity } from "./recordLearningActivity.js";
import { ValidationError } from "../errors.js";

/**
 * SM-2 spaced repetition. `quality` is 0-5 (SuperMemo scale); the UI only
 * exposes three grades — Again=2, Good=4, Easy=5 — mapped in the router.
 * A quality below 3 counts as a lapse: repetitions reset and the card comes
 * straight back tomorrow instead of riding its old interval.
 */
export function scheduleReview({ easeFactor, intervalDays, repetitions }, quality) {
  if (quality < 3) {
    return { easeFactor, intervalDays: 1, repetitions: 0 };
  }

  const nextRepetitions = repetitions + 1;
  const nextInterval = repetitions === 0 ? 1 : repetitions === 1 ? 6 : Math.round(intervalDays * easeFactor);
  const nextEase = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return { easeFactor: nextEase, intervalDays: nextInterval, repetitions: nextRepetitions };
}

export async function reviewVocab({ userId, vocabId, quality }, { vocabReviewRepository, userRepository }, now = new Date()) {
  if (!Number.isInteger(quality) || quality < 0 || quality > 5) {
    throw new ValidationError("quality must be an integer 0-5");
  }

  const today = localDate(now);
  const existing = await vocabReviewRepository.get(userId, vocabId);
  const state = existing
    ? { easeFactor: existing.ease_factor, intervalDays: existing.interval_days, repetitions: existing.repetitions }
    : { easeFactor: 2.5, intervalDays: 0, repetitions: 0 };

  const next = scheduleReview(state, quality);
  const dueDate = shiftDate(today, next.intervalDays);

  await vocabReviewRepository.upsert(userId, vocabId, {
    easeFactor: next.easeFactor,
    intervalDays: next.intervalDays,
    repetitions: next.repetitions,
    dueDate,
    reviewedAt: today
  });

  await recordLearningActivity({ userId }, { userRepository }, now);

  return { dueDate, ...next };
}
