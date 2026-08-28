/** Chuan hoa de so khop: thuong hoa + bo dau cau, giu lai chu va so. */
export function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z0-9']/g, "");
}

export type DiffWord = { word: string; ok: boolean };

/**
 * So cau nguoi hoc doc/go voi cau goc, tra ve tung tu cua cau goc kem dung/sai.
 * ponytail: two-pointer greedy thay vi LCS — du tot cho cau ngan, nang cap LCS neu can.
 */
export function diffWords(target: string, attempt: string): { words: DiffWord[]; score: number } {
  const targetWords = target.split(/\s+/).filter((w) => normalizeWord(w));
  const attemptNorm = attempt.split(/\s+/).map(normalizeWord).filter(Boolean);
  let j = 0;
  const words = targetWords.map((word) => {
    const norm = normalizeWord(word);
    // Cho phep nguoi doc chen/bo vai tu: tim tu ke tiep trong pham vi 2 tu.
    const found = attemptNorm.slice(j, j + 3).indexOf(norm);
    if (found >= 0) {
      j += found + 1;
      return { word, ok: true };
    }
    return { word, ok: false };
  });
  const okCount = words.filter((w) => w.ok).length;
  return { words, score: words.length ? Math.round((okCount / words.length) * 100) : 0 };
}
