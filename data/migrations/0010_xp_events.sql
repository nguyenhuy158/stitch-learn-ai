-- Log tung lan cong XP, de tinh duoc bang xep hang theo TUAN (users.xp chi
-- la tong don thuan, khong biet XP kiem luc nao). "day" la YYYY-MM-DD theo
-- gio Viet Nam, giong quy uoc chung. Chi tinh tu luc bang nay ton tai ve sau,
-- lich su XP truoc do khong duoc backfill.
CREATE TABLE IF NOT EXISTS xp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  amount INTEGER NOT NULL,
  day TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_day ON xp_events(user_id, day);
CREATE INDEX IF NOT EXISTS idx_xp_events_day ON xp_events(day);
