import { recordLearningActivity } from "./recordLearningActivity.js";

/** Tag cho tu nguoi hoc tu bam luu khi doc ban dich tham khao. */
export const LOOKUP_WORD_TAG = "ai-lookup";

/**
 * Tra nghia mot tu. Cache o D1 vi cung mot tu thi ket qua nhu nhau, ma moi
 * lan hoi AI mat vai giay. Cache theo tu goc nguoi hoc bam (khong theo cau),
 * chap nhan mat sac thai ngu canh de doi lay tra loi tuc thi.
 */
export async function lookupWord({ term, context }, { wordLookupPort, wordLookupCacheRepository, dictionaryPort, savedVocabRepository, wordFrequencyRepository, wikipediaEtymologyPort, wikipediaEtymologyRepository }) {
  const key = term.trim().toLowerCase();
  // Level CEFR (Oxford), frequency (SUBTLEX), etymology (Wikipedia) lay song song tu D1/cache.
  // Loi cache (vd chua chay migration) thi fallback null, khong hong lookup.
  const levelPromise = Promise.resolve(savedVocabRepository?.getTermLevel(key)).catch(() => null);
  const frequencyPromise = Promise.resolve(wordFrequencyRepository?.getByTerm(key)).catch(() => null);
  const etymologyPromise = loadEtymology(key, wikipediaEtymologyRepository, wikipediaEtymologyPort).catch((err) => {
    console.error("Etymology error:", err);
    return { etymology: "", sectionTitle: "" };
  });
  // Cache loi (vd chua chay migration) thi cu hoi AI, dung de hong tinh nang.
  const cached = await wordLookupCacheRepository.get(key).catch((err) => {
    console.error("Read word lookup cache error:", err);
    return null;
  });
  if (cached) {
    const [level, frequency, etymology] = await Promise.all([levelPromise, frequencyPromise, etymologyPromise]);
    return { ...cached, level, frequency, etymology };
  }

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
  const [level, frequency, etymology] = await Promise.all([levelPromise, frequencyPromise, etymologyPromise]);
  return { ...word, level, frequency, etymology };
}

/**
 * Lay etymology tu Wikipedia, co cache D1 30 ngay.
 * Neu cache con han -> dung cache. Neu khong/chua co -> goi API, cache lai (async, khong block).
 * Tra ve object {etymology, sectionTitle} (rong neu that bai).
 */
async function loadEtymology(key, repository, port) {
  if (!repository || !port) return { etymology: "", sectionTitle: "" };
  const cached = await repository.getByTerm(key);
  if (cached) return { etymology: cached.etymology, sectionTitle: cached.sectionTitle };
  const fresh = await port.lookup(key);
  if (!fresh || !fresh.etymology) return { etymology: "", sectionTitle: "" };
  repository.upsert({
    term: key,
    etymology: fresh.etymology,
    sectionTitle: fresh.sectionTitle,
    fetchedAt: new Date().toISOString()
  }).catch((err) => console.error("Cache etymology error:", err));
  return fresh;
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

/** Frequency rank theo SUBTLEX-US. Tra null neu tu khong co trong 74k tu pho bien nhat. */
export async function getWordFrequency({ term }, { wordFrequencyRepository }) {
  return wordFrequencyRepository?.getByTerm(term) ?? null;
}
