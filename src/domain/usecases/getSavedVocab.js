export async function getSavedVocab({ userId }, { savedVocabRepository }) {
  return savedVocabRepository.listForUser(userId);
}
