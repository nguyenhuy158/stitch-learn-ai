import { localDate } from "../streak.js";

export const QUESTION_COUNT = 5;
export const CHALLENGE_XP = 15;

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 5 multiple-choice questions (term -> pick the right Vietnamese meaning),
 * built from the existing vocab pool — no Mochi call, so it's free to
 * regenerate any time the day's challenge hasn't been completed yet.
 * The correct answer ships with the question and is graded client-side;
 * this app has no anti-cheat bar (same trust level as the chat XP grant).
 */
export async function getDailyChallenge({ userId }, { dailyChallengeRepository }, now = new Date()) {
  const day = localDate(now);
  const existing = await dailyChallengeRepository.getForDay(userId, day);
  if (existing) {
    return { day, completed: true, xpAwarded: existing.xp_awarded, questions: [] };
  }

  const pool = await dailyChallengeRepository.pickRandomVocab(QUESTION_COUNT * 4);
  const questionCount = Math.min(QUESTION_COUNT, Math.floor(pool.length / 4));
  const questions = Array.from({ length: questionCount }, (_, i) => {
    const slice = pool.slice(i * 4, i * 4 + 4);
    const [correct] = slice;
    return {
      vocabId: correct.id,
      term: correct.term,
      correctMeaning: correct.meaning,
      choices: shuffle(slice.map((v) => v.meaning))
    };
  });

  return { day, completed: false, xpAwarded: 0, questions };
}
