import { ValidationError } from "../errors.js";

export const GAMES = ["word-game", "listening-game", "matching-game", "spelling-game", "word-race"];

export async function submitGameScore({ userId, game, score }, { gameScoreRepository }, now = new Date()) {
  if (!GAMES.includes(game)) throw new ValidationError("Invalid game");
  const cleanScore = Math.max(0, Math.floor(Number(score) || 0));
  const previousBest = await gameScoreRepository.bestForUser(userId, game);
  await gameScoreRepository.record(userId, game, cleanScore, now.toISOString());
  return { score: cleanScore, bestScore: Math.max(previousBest, cleanScore), isNewBest: cleanScore > previousBest };
}
