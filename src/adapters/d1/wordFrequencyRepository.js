/**
 * Repository cho bang word_frequency (SUBTLEX-US, migration 0027).
 * Static lookup theo term - khong can tham so, chi tra ve 1 row hoac null.
 *
 * @returns {import("../../ports/index.js").WordFrequencyRepository}
 */
export function createD1WordFrequencyRepository(db) {
  return {
    /**
     * Tra frequency cua 1 tu (lowercase). Tra null neu tu khong co trong SUBTLEX
     * (vi du proper noun rat hiem, tu moi, typo...).
     * @param {string} term
     * @returns {Promise<{term: string, freqCount: number, cdCount: number, log10wf: number, rank: number}|null>}
     */
    async getByTerm(term) {
      if (!term) return null;
      const key = term.trim().toLowerCase();
      const row = await db
        .prepare("SELECT term, freq_count, cd_count, log10wf, rank FROM word_frequency WHERE term = ?")
        .bind(key)
        .first();
      if (!row) return null;
      return {
        term: row.term,
        freqCount: row.freq_count,
        cdCount: row.cd_count,
        log10wf: row.log10wf,
        rank: row.rank
      };
    },

    /**
     * Batch lookup - dung khi can frequency cho nhieu tu cung luc
     * (vd: ranking vocab trong lesson, flashcard deck).
     * @param {string[]} terms
     * @returns {Promise<Map<string, {freqCount: number, rank: number}>>}
     */
    async getByTerms(terms) {
      const out = new Map();
      if (!terms || terms.length === 0) return out;
      // D1 khong ho tro bind array truc tiep, dung placeholder generated.
      const placeholders = terms.map(() => "?").join(",");
      const rows = await db
        .prepare(
          `SELECT term, freq_count, cd_count, log10wf, rank
             FROM word_frequency
            WHERE term IN (${placeholders})`
        )
        .bind(...terms.map((t) => t.trim().toLowerCase()))
        .all();
      for (const row of rows.results ?? []) {
        out.set(row.term, {
          freqCount: row.freq_count,
          cdCount: row.cd_count,
          log10wf: row.log10wf,
          rank: row.rank
        });
      }
      return out;
    },

    /**
     * Insert/update mot tu. Dung cho seed script.
     * @param {{term: string, freqCount: number, cdCount: number, log10wf: number, rank: number}} row
     */
    async upsert(row) {
      await db
        .prepare(
          `INSERT INTO word_frequency (term, freq_count, cd_count, log10wf, rank)
             VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(term) DO UPDATE SET
             freq_count = excluded.freq_count,
             cd_count = excluded.cd_count,
             log10wf = excluded.log10wf,
             rank = excluded.rank`
        )
        .bind(
          row.term.trim().toLowerCase(),
          row.freqCount,
          row.cdCount,
          row.log10wf,
          row.rank
        )
        .run();
    }
  };
}
