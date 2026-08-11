import { ValidationError } from "../errors.js";
import { GAMES } from "./submitGameScore.js";

export async function getGameLeaderboard({ userId, game }, { gameScoreRepository }) {
  if (!GAMES.includes(game)) throw new ValidationError("Invalid game");
  const top = await gameScoreRepository.topScores(game, 20);
  const myBest = await gameScoreRepository.bestForUser(userId, game);
  const myRank = top.findIndex((row) => row.user_id === userId);
  return { top, myBest, myRank: myRank >= 0 ? myRank + 1 : null };
}
