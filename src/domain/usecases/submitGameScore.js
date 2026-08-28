import { ValidationError } from "../errors.js";
import { localDate } from "../streak.js";
import { recordLearningActivity } from "./recordLearningActivity.js";

export const GAMES = ["word-game", "listening-game", "matching-game", "spelling-game", "word-race", "scramble-game"];

// XP per finished round: correct-answer games pay 1 XP/correct answer (capped so a
// long "legend" run can't outpay real lessons); matching pays a flat completion bonus.
const XP_BY_GAME = {
  "word-game": (correct) => Math.min(20, correct),
  "listening-game": (correct) => Math.min(12, correct),
  "spelling-game": (correct) => Math.min(10, correct),
  "word-race": (correct) => Math.min(20, correct),
  "matching-game": () => 5,
  "scramble-game": (correct) => Math.min(12, correct)
};

export async function submitGameScore({ userId, game, score, correct }, deps, now = new Date()) {
  const { gameScoreRepository, userRepository } = deps;
  if (!GAMES.includes(game)) throw new ValidationError("Invalid game");
  const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
  const cleanCorrect = Math.max(0, Math.floor(Number(correct) || 0));

  const previousBest = await gameScoreRepository.bestForUser(userId, game);
  await gameScoreRepository.record(userId, game, cleanScore, now.toISOString());

  const xpAwarded = Math.max(0, XP_BY_GAME[game](cleanCorrect));
  if (xpAwarded > 0) {
    await userRepository.incrementXp(userId, xpAwarded, localDate(now));
    await recordLearningActivity({ userId }, deps, now);
  }

  return {
    score: cleanScore,
    bestScore: Math.max(previousBest, cleanScore),
    isNewBest: cleanScore > previousBest,
    xpAwarded
  };
}
