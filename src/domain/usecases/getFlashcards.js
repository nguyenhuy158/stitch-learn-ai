import { localDate } from "../streak.js";

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Due cards first (spaced repetition), new/never-reviewed words fill the rest. Loc level CEFR neu chon. */
export async function getFlashcards({ userId, limit = 30, level }, { vocabReviewRepository }, now = new Date()) {
  const pick = CEFR_LEVELS.includes(level) ? level : null;
  return vocabReviewRepository.listDue(userId, localDate(now), limit, pick);
}

/** So the den han on hom nay — cho badge tren Home. */
export async function getDueCount({ userId }, { vocabReviewRepository }, now = new Date()) {
  return { count: await vocabReviewRepository.countDue(userId, localDate(now)) };
}
