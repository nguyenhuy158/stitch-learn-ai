-- Song ngu: ban dich Viet cua tung paragraph (JSON array, '' = chua dich)
ALTER TABLE reading_articles ADD COLUMN translations TEXT NOT NULL DEFAULT '';

-- Lich su lam quiz doc hieu cua tung nguoi hoc
CREATE TABLE IF NOT EXISTS reading_quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  guid TEXT NOT NULL,
  correct INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_reading_quiz_attempts_user_guid ON reading_quiz_attempts(user_id, guid, created_at DESC);
