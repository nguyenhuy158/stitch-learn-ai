-- Tách vocab khỏi lesson 1-1: 1 từ có thể thuộc nhiều lesson + nhiều tag,
-- kèm word_family (JSON array các dạng từ liên quan).

CREATE TABLE vocab (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  term TEXT NOT NULL UNIQUE,
  type TEXT,
  pronounce TEXT,
  meaning TEXT NOT NULL,
  example TEXT,
  word_family TEXT
);

CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE vocab_tags (
  vocab_id INTEGER NOT NULL REFERENCES vocab(id),
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (vocab_id, tag_id)
);

CREATE TABLE lesson_vocab_new (
  lesson_id INTEGER NOT NULL REFERENCES lessons(id),
  vocab_id INTEGER NOT NULL REFERENCES vocab(id),
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (lesson_id, vocab_id)
);

CREATE TABLE saved_vocab_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  vocab_id INTEGER NOT NULL REFERENCES vocab(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, vocab_id)
);

-- Dedupe theo term: nếu cùng từ xuất hiện ở nhiều lesson với meaning khác nhau,
-- giữ bản đầu tiên (ON CONFLICT DO NOTHING) — dữ liệu hiện tại chỉ 8 dòng, rủi ro thấp.
INSERT INTO vocab (term, meaning, example)
  SELECT term, meaning, example FROM lesson_vocab
  ORDER BY id
  ON CONFLICT(term) DO NOTHING;

INSERT INTO lesson_vocab_new (lesson_id, vocab_id, sort_order)
  SELECT lv.lesson_id, v.id, lv.sort_order
  FROM lesson_vocab lv JOIN vocab v ON v.term = lv.term;

INSERT INTO saved_vocab_new (user_id, vocab_id, created_at)
  SELECT sv.user_id, v.id, sv.created_at
  FROM saved_vocab sv
  JOIN lesson_vocab lv ON lv.id = sv.vocab_id
  JOIN vocab v ON v.term = lv.term;

DROP TABLE saved_vocab;
DROP TABLE lesson_vocab;
ALTER TABLE lesson_vocab_new RENAME TO lesson_vocab;
ALTER TABLE saved_vocab_new RENAME TO saved_vocab;

CREATE INDEX idx_vocab_tags_tag ON vocab_tags(tag_id);
