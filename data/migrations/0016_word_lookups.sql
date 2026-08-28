-- Cache ket qua tra tu cua Mochi: cung mot tu thi ai hoi cung ra nhu nhau,
-- khong can goi AI lai (moi call mat vai giay).
CREATE TABLE IF NOT EXISTS word_lookups (
  term TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT '',
  meaning TEXT NOT NULL,
  example TEXT NOT NULL DEFAULT '',
  synonyms TEXT NOT NULL DEFAULT '',
  antonyms TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
