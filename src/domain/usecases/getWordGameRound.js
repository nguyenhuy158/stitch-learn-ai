import { ValidationError } from "../errors.js";
import { shuffle } from "../shuffle.js";

export const DIFFICULTIES = {
  easy: { levels: ["A1", "A2"], words: 10, secondsPerWord: 10 },
  hard: { levels: ["B1", "B2"], words: 15, secondsPerWord: 7 },
  legend: { levels: ["A1", "A2", "B1", "B2", "C1", "C2"], words: 20, secondsPerWord: 5 }
};

const OPTIONS_PER_QUESTION = 4;

/** One round of the word-guess game: a random word per question, 4 meaning choices, one correct. */
export async function getWordGameRound({ difficulty }, { wordGameRepository }) {
  const config = DIFFICULTIES[difficulty];
  if (!config) throw new ValidationError("Invalid difficulty");

  const poolSize = config.words * OPTIONS_PER_QUESTION;
  const pool = await wordGameRepository.listRandomByLevels(config.levels, poolSize);
  if (pool.length < config.words) throw new ValidationError("Not enough vocab for this difficulty");

  const targets = pool.slice(0, config.words);
  const distractorPool = pool.slice(config.words);

  const questions = targets.map((target, i) => {
    const others = shuffle(distractorPool.filter((w) => w.meaning !== target.meaning));
    const wrongMeanings = [];
    for (const w of others) {
      if (wrongMeanings.length >= OPTIONS_PER_QUESTION - 1) break;
      wrongMeanings.push(w.meaning);
    }
    // Fall back to other targets' meanings if the distractor pool ran short.
    if (wrongMeanings.length < OPTIONS_PER_QUESTION - 1) {
      for (const w of targets) {
        if (wrongMeanings.length >= OPTIONS_PER_QUESTION - 1) break;
        if (w.id !== target.id && w.meaning !== target.meaning && !wrongMeanings.includes(w.meaning)) {
          wrongMeanings.push(w.meaning);
        }
      }
    }
    return {
      id: target.id,
      term: target.term,
      choices: shuffle([target.meaning, ...wrongMeanings]),
      correctMeaning: target.meaning
    };
  });

  return { difficulty, secondsPerWord: config.secondsPerWord, questions };
}
