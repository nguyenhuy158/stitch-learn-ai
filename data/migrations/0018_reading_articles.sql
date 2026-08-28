-- Bai doc theo level lay tu RSS newsinlevels.com, cache trong D1.
CREATE TABLE IF NOT EXISTS reading_articles (
  guid TEXT PRIMARY KEY,        -- guid tu RSS
  story TEXT NOT NULL,          -- ten tin goc (khong co " - level N"), dung nhom 3 level
  level INTEGER NOT NULL,       -- 1 | 2 | 3
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL,
  paragraphs TEXT NOT NULL,     -- JSON array cac doan van thuan chu
  source_url TEXT NOT NULL,
  fetched_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_published ON reading_articles(published_at DESC);
