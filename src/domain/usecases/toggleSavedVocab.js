export async function toggleSavedVocab({ userId, vocabId, save }, { savedVocabRepository }) {
  if (save) {
    await savedVocabRepository.save(userId, vocabId);
  } else {
    await savedVocabRepository.unsave(userId, vocabId);
  }
}
