/** Chon ngau nhien mot tu da hoc va nho AI dat mot cau tieng Viet de dich. */
export const AI_WORD_TAG = "ai-translation";

export async function getTranslationExercise(
  { userId },
  { dailyChallengeRepository, translationExercisePort, savedVocabRepository }
) {
  const [vocab] = await dailyChallengeRepository.pickRandomVocab(1);
  const { vietnamese, newWord } = await translationExercisePort.generate({
    term: vocab.term,
    meaning: vocab.meaning,
    example: vocab.example ?? null
  });
  // Tu moi AI goi y duoc them thang vao bo suu tap, gan tag de phan biet voi
  // tu cua bai hoc. Loi o buoc nay khong duoc lam hong bai tap dang cho.
  if (newWord) {
    try {
      await savedVocabRepository.saveGeneratedWord(userId, newWord, AI_WORD_TAG);
    } catch (err) {
      console.error("Save AI word error:", err);
    }
  }
  return { vietnamese, term: vocab.term, newWord };
}
