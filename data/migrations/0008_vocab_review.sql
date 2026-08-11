-- SM-2 spaced repetition state per (user, vocab). Moi tu bat dau chua co
-- dong nao trong bang nay — coi la "due ngay" cho toi khi nguoi dung cham
-- diem lan dau. due_date la YYYY-MM-DD theo gio Viet Nam, so sanh bang
-- chuoi (khong dung Date) giong quy uoc chung cua project.
CREATE TABLE IF NOT EXISTS vocab_review (
  user_id TEXT NOT NULL REFERENCES users(id),
  vocab_id INTEGER NOT NULL REFERENCES vocab(id),
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetitions INTEGER NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL,
  last_reviewed TEXT,
  PRIMARY KEY (user_id, vocab_id)
);

CREATE INDEX IF NOT EXISTS idx_vocab_review_user_due ON vocab_review(user_id, due_date);
