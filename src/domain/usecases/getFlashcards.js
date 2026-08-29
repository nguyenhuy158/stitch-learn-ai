import { localDate } from "../streak.js";

/** Due cards first (spaced repetition), new/never-reviewed words fill the rest. */
export async function getFlashcards({ userId, limit = 30 }, { vocabReviewRepository }, now = new Date()) {
  return vocabReviewRepository.listDue(userId, localDate(now), limit);
}

/** So the den han on hom nay — cho badge tren Home. */
export async function getDueCount({ userId }, { vocabReviewRepository }, now = new Date()) {
  return { count: await vocabReviewRepository.countDue(userId, localDate(now)) };
}
