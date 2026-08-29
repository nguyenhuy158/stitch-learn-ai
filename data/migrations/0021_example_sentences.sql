-- Cau vi du that tu Tatoeba (EN + ban dich Viet), cache theo tu.
CREATE TABLE IF NOT EXISTS example_sentences (
  term TEXT PRIMARY KEY,        -- tu da lowercase/trim
  examples TEXT NOT NULL,       -- JSON array [{en, vi}]
  created_at TEXT NOT NULL
);
