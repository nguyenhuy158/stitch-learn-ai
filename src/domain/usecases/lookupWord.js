import { recordLearningActivity } from "./recordLearningActivity.js";

/** Tag cho tu nguoi hoc tu bam luu khi doc ban dich tham khao. */
export const LOOKUP_WORD_TAG = "ai-lookup";

export function lookupWord({ term, context }, { wordLookupPort }) {
  return wordLookupPort.lookup({ term, context });
}

/** Luu tu vua tra cuu vao bo suu tap (tu nay khong thuoc lesson nao). */
export async function saveLookedUpWord({ userId, word }, deps) {
  await deps.savedVocabRepository.saveGeneratedWord(userId, word, LOOKUP_WORD_TAG);
  await recordLearningActivity({ userId }, deps);
}
