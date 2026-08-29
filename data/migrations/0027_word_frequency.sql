-- Word frequency thật từ SUBTLEX-US (8.4M phụ đề phim Mỹ, ~74k từ).
-- Source: cltl/python-for-text-analysis Data/SUBTLEX-US/SUBTLEXus74286wordstextversion.txt
-- License: CC BY 4.0 (Brysbaert et al. 2012).
-- Seed xem scripts/seed-subtlex.mjs (chạy 1 lần, generate INSERT statements).
--
-- Columns:
--   term: tu lowercase, PRIMARY KEY
--   freq_count: so lan xuat hien trong toan bo corpus 51M tu
--   cd_count: so phim/series khac nhau co tu nay (contextual diversity, max 8388)
--   log10wf: log10(freq_count + 1), dung cho statistical analysis
--   rank: thu hang theo freq_count DESC (1 = pho bien nhat)
--
-- Use case:
--   - Sap xep vocab theo "tu pho bien" thay vi alphabet/CEFR
--   - Hien chip "pho bien thu #N" trong flashcard + popup tra tu
--   - LookupWord tra them frequency de user biet tu do co thuc su thong dung khong
--   - Oxford 5000 thuoc chuong trinh, SUBTLEX phan anh tieng Anh noi that hang ngay
CREATE TABLE IF NOT EXISTS word_frequency (
  term TEXT PRIMARY KEY,         -- term lowercase
  freq_count INTEGER NOT NULL,   -- raw frequency count
  cd_count INTEGER NOT NULL,     -- contextual diversity (so phim)
  log10wf REAL NOT NULL,         -- log10(freq_count + 1)
  rank INTEGER NOT NULL          -- global rank theo freq_count DESC
);

CREATE INDEX IF NOT EXISTS idx_word_frequency_rank ON word_frequency(rank);
