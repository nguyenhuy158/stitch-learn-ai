export async function getFlashcards(_input, { lessonRepository }) {
  return lessonRepository.listAllVocab();
}
