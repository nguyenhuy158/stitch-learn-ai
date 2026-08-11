import { localDate } from "../streak.js";
import { recordLearningActivity } from "./recordLearningActivity.js";
import { CHALLENGE_XP } from "./getDailyChallenge.js";
import { ValidationError } from "../errors.js";

/** Idempotent: replaying this on a day already completed just echoes back the original award, no double XP. */
export async function completeDailyChallenge({ userId, score }, deps, now = new Date()) {
  if (!Number.isInteger(score) || score < 0) throw new ValidationError("score must be a non-negative integer");

  const { dailyChallengeRepository, userRepository } = deps;
  const day = localDate(now);

  const existing = await dailyChallengeRepository.getForDay(userId, day);
  if (existing) return { completed: true, xpAwarded: existing.xp_awarded };

  await dailyChallengeRepository.markCompleted(userId, day, CHALLENGE_XP, day);
  await userRepository.incrementXp(userId, CHALLENGE_XP);
  await recordLearningActivity({ userId }, deps, now);

  return { completed: true, xpAwarded: CHALLENGE_XP, score };
}
