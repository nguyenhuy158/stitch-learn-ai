import { recordLearningActivity } from "./recordLearningActivity.js";

/** Tag cho tu nguoi hoc tu bam luu khi doc ban dich tham khao. */
export const LOOKUP_WORD_TAG = "ai-lookup";

/**
 * Tra nghia mot tu. Cache o D1 vi cung mot tu thi ket qua nhu nhau, ma moi
 * lan hoi AI mat vai giay. Cache theo tu goc nguoi hoc bam (khong theo cau),
 * chap nhan mat sac thai ngu canh de doi lay tra loi tuc thi.
 */
export async function lookupWord({ term, context }, { wordLookupPort, wordLookupCacheRepository }) {
  const key = term.trim().toLowerCase();
  // Cache loi (vd chua chay migration) thi cu hoi AI, dung de hong tinh nang.
  const cached = await wordLookupCacheRepository.get(key).catch((err) => {
    console.error("Read word lookup cache error:", err);
    return null;
  });
  if (cached) return cached;

  const word = await wordLookupPort.lookup({ term, context });
  // Cache hong khong duoc lam hong ket qua da co.
  try {
    await wordLookupCacheRepository.put(key, word, new Date().toISOString());
  } catch (err) {
    console.error("Cache word lookup error:", err);
  }
  return word;
}

/** Tu nay da nam trong bo suu tap cua nguoi hoc chua. */
export async function isWordSaved({ userId, term }, deps) {
  return deps.savedVocabRepository.isTermSaved(userId, term.trim());
}

/** Luu tu vua tra cuu vao bo suu tap (tu nay khong thuoc lesson nao). */
export async function saveLookedUpWord({ userId, word }, deps) {
  await deps.savedVocabRepository.saveGeneratedWord(userId, word, LOOKUP_WORD_TAG);
  await recordLearningActivity({ userId }, deps);
}
