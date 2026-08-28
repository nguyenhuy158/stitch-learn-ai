/** Picks a random studied vocab word and asks Mochi for a Vietnamese sentence to translate. */
export async function getTranslationExercise(_input, { dailyChallengeRepository, translationExercisePort }) {
  const [vocab] = await dailyChallengeRepository.pickRandomVocab(1);
  const { vietnamese } = await translationExercisePort.generate({
    term: vocab.term,
    meaning: vocab.meaning,
    example: vocab.example ?? null
  });
  return { vietnamese, term: vocab.term };
}
