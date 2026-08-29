-- Etymology cache tu Wikipedia (https://en.wikipedia.org/w/api.php), section "Etymology"
-- cua tung tu. Wikitext da strip markup ([[link]] -> link, {{template}} -> "", <ref>...</ref> -> "").
-- Worker goi 2 HTTP: 1 list sections (tim "Etymology") + 1 lay content section do.
-- Cache 30 ngay, sau do re-fetch.
--
-- Use case: popup tra tu hien them section "Nguon goc tu" (etymology EN) ben canh
-- nghia Tieng Viet tu Mochi. Mochi hay bịa etymology, Wikipedia community-verified.
CREATE TABLE IF NOT EXISTS wikipedia_etymology (
  term TEXT PRIMARY KEY,         -- term lowercase
  etymology TEXT NOT NULL,       -- wikitext da strip, max 500 ky tu
  section_title TEXT NOT NULL,   -- ten section goc (thuong la "Etymology")
  fetched_at TEXT NOT NULL       -- ISO timestamp
);

CREATE INDEX IF NOT EXISTS idx_wikipedia_etymology_fetched ON wikipedia_etymology(fetched_at);
