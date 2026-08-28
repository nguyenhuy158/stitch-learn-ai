-- Luu lai tung lan dich cau de nguoi hoc xem lai lich su (truoc day ket qua
-- cham cua Gemini bien mat ngay khi doi sang cau tiep theo).
CREATE TABLE IF NOT EXISTS translation_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  vietnamese TEXT NOT NULL,
  translation TEXT NOT NULL,
  corrected TEXT NOT NULL,
  feedback TEXT NOT NULL,
  correction_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_translation_attempts_user
  ON translation_attempts(user_id, id DESC);
