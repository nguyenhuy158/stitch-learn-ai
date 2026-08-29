import { recordLearningActivity } from "./recordLearningActivity.js";

/** Tag cho tu nguoi hoc tu bam luu khi doc ban dich tham khao. */
export const LOOKUP_WORD_TAG = "ai-lookup";

/**
 * Tra nghia mot tu. Cache o D1 vi cung mot tu thi ket qua nhu nhau, ma moi
 * lan hoi AI mat vai giay. Cache theo tu goc nguoi hoc bam (khong theo cau),
 * chap nhan mat sac thai ngu canh de doi lay tra loi tuc thi.
 */
export async function lookupWord({ term, context }, { wordLookupPort, wordLookupCacheRepository, dictionaryPort, savedVocabRepository }) {
  const key = term.trim().toLowerCase();
  // Level CEFR lay tu kho vocab (Oxford 3000/5000), khong cache theo lookup.
  const levelPromise = Promise.resolve(savedVocabRepository?.getTermLevel(key)).catch(() => null);
  // Cache loi (vd chua chay migration) thi cu hoi AI, dung de hong tinh nang.
  const cached = await wordLookupCacheRepository.get(key).catch((err) => {
    console.error("Read word lookup cache error:", err);
    return null;
  });
  if (cached) return { ...cached, level: await levelPromise };

  // Hoi AI va tu dien mien phi song song: AI cho nghia Viet, tu dien cho audio
  // mp3 doc tu that + dong nghia bo sung. Tu dien loi thi bo qua, khong hong lookup.
  const [word, dict] = await Promise.all([
    wordLookupPort.lookup({ term, context }),
    Promise.resolve(dictionaryPort?.lookup(key) ?? { audioUrl: "", synonyms: [], antonyms: [] }).catch((err) => {
      console.error("Dictionary API error:", err);
      return { audioUrl: "", synonyms: [], antonyms: [] };
    })
  ]);
  word.audioUrl = dict.audioUrl;
  if (word.synonyms.length === 0) word.synonyms = dict.synonyms;
  if (word.antonyms.length === 0) word.antonyms = dict.antonyms;
  // Cache hong khong duoc lam hong ket qua da co.
  try {
    await wordLookupCacheRepository.put(key, word, new Date().toISOString());
  } catch (err) {
    console.error("Cache word lookup error:", err);
  }
  return { ...word, level: await levelPromise };
}

/**
 * Cau vi du that (Tatoeba) kem ban dich Viet cho tu vua tra. Cache ca ket qua
 * rong vi kho cau Tatoeba doi rat cham; nguon loi thi tra rong, khong hong popup.
 */
export async function getWordExamples({ term }, { exampleSentencesPort, exampleSentencesRepository }) {
  const key = term.trim().toLowerCase();
  const cached = await exampleSentencesRepository.get(key).catch((err) => {
    console.error("Read examples cache error:", err);
    return null;
  });
  if (cached) return { examples: cached };

  let examples = [];
  try {
    examples = await exampleSentencesPort.search(key);
    await exampleSentencesRepository.put(key, examples, new Date().toISOString());
  } catch (err) {
    console.error("Word examples error:", err);
  }
  return { examples };
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
