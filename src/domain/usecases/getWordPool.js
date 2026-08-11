import { ValidationError } from "../errors.js";

const ALL_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const MAX_COUNT = 30;

export const DIFFICULTY_LEVELS = {
  easy: ["A1", "A2"],
  hard: ["B1", "B2"],
  legend: ALL_LEVELS
};

/** A plain random set of {id, term, meaning} — backs matching/spelling/typing-race games. */
export async function getWordPool({ count = 8, levels }, { wordGameRepository }) {
  const n = Math.min(Math.max(Number(count) || 8, 2), MAX_COUNT);
  const pickLevels = Array.isArray(levels) && levels.length > 0 ? levels : ALL_LEVELS;
  const words = await wordGameRepository.listRandomByLevels(pickLevels, n);
  if (words.length < n) throw new ValidationError("Not enough vocab");
  return { words };
}
