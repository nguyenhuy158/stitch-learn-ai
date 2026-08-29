#!/usr/bin/env node

// Parse SUBTLEX-US 74286 word frequency list, generate INSERT statements
// cho migration 0027_word_frequency.
//
// Usage:
//   1. Download SUBTLEX file:
//      curl -sL "https://raw.githubusercontent.com/cltl/python-for-text-analysis/master/Data/SUBTLEX-US/SUBTLEXus74286wordstextversion.txt" \
//        -o /tmp/subtlex.txt
//   2. Run: node scripts/seed-subtlex.mjs /tmp/subtlex.txt > data/migrations/0027_word_frequency_seed.sql
//   3. Verify row count, then apply to D1 (local + remote).
//
// File format (tab-separated, 9 columns):
//   Word  FREQcount  CDcount  FREQlow  CDlow  SUBTLWF  Lg10WF  SUBTLCD  Lg10CD
//   the   1501908    8388     1339811  8388   29449.18 6.1766  100.00   3.9237
//
// Output: SQL file voi INSERT statements, moi row la 1 statement de khong vuot
// qua D1 batch size. Term duoc lowercase, rank duoc tinh theo FREQcount DESC.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputPath = process.argv[2] || "/tmp/subtlex.txt";
const rows = readFileSync(resolve(inputPath), "utf8")
  .trim()
  .split("\n")
  .slice(1) // bo header
  .map((line) => line.split("\t"));

console.error(`Parsed ${rows.length} rows from ${inputPath}`);

// Sort theo FREQcount DESC de gan rank (1 = pho bien nhat).
// Luu y: file goc co the khong sort theo FREQcount (sort theo word?).
// Can sort lai de dam bao rank chinh xac.
rows.sort((a, b) => Number(b[1]) - Number(a[1]));

const INSERT_HEADER = `\
-- Seed data cho bang word_frequency (SUBTLEX-US, ~74k tu).
-- Source: https://github.com/cltl/python-for-text-analysis/blob/master/Data/SUBTLEX-US/SUBTLEXus74286wordstextversion.txt
-- License: CC BY 4.0 (Brysbaert, New, Keuleers 2012).
-- File nay duoc generate tu scripts/seed-subtlex.mjs.
-- Columns: term (lowercase), freq_count, cd_count, log10wf, rank.
--
-- Chay local:   npx wrangler d1 execute ai-english --local --file=...
-- Chay remote:  npx wrangler d1 execute ai-english --remote --file=...
`;

process.stdout.write(INSERT_HEADER + "\n");

const BATCH_SIZE = 500;
for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE);
  const values = batch
    .map((cols, idx) => {
      const rank = i + idx + 1;
      const term = cols[0].toLowerCase().replace(/'/g, "''");
      const freqCount = Number(cols[1]);
      const cdCount = Number(cols[2]);
      const log10wf = Number(cols[6]);
      return `('${term}', ${freqCount}, ${cdCount}, ${log10wf}, ${rank})`;
    })
    .join(",\n  ");
  process.stdout.write(
    `INSERT OR REPLACE INTO word_frequency (term, freq_count, cd_count, log10wf, rank) VALUES\n  ${values};\n\n`
  );
}

console.error(`Generated ${rows.length} rows in ${Math.ceil(rows.length / BATCH_SIZE)} batches`);
