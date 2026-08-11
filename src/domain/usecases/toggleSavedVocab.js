import { recordLearningActivity } from "./recordLearningActivity.js";

export async function toggleSavedVocab({ userId, vocabId, save }, deps) {
  const { savedVocabRepository } = deps;
  if (save) {
    await savedVocabRepository.save(userId, vocabId);
    // Only saving counts as studying; un-saving is housekeeping.
    await recordLearningActivity({ userId }, deps);
  } else {
    await savedVocabRepository.unsave(userId, vocabId);
  }
}
