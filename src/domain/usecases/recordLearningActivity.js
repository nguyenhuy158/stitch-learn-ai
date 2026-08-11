import { computeStreak, localDate } from "../streak.js";

/** Same window getCurrentUser reads back; plenty for any real streak. */
const HISTORY_DAYS = 400;

/**
 * Marks today as a day the user actually learned something. Called from the
 * learning actions (chat, writing review, saving a word, opening a lesson) —
 * never from a plain page load, which is what used to inflate the streak.
 *
 * Failures are swallowed: a streak dot is not worth failing the lesson the
 * user is in the middle of.
 */
export async function recordLearningActivity({ userId }, { userRepository }, now = new Date()) {
  if (!userId) return;
  try {
    const today = localDate(now);
    await userRepository.recordActivityDay(userId, today);
    // users.streak stays as a denormalised copy so the rankings query can sort
    // on it without recomputing every player's streak.
    const days = await userRepository.listActivityDays(userId, HISTORY_DAYS);
    await userRepository.updateStreak(userId, {
      streak: computeStreak(days, today),
      last_active_date: today
    });
  } catch (error) {
    console.error("Failed to record learning activity:", error);
  }
}
