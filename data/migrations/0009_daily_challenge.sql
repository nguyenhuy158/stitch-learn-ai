-- Mot dong = mot ngay nguoi dung da hoan thanh Daily Challenge (5 cau trac
-- nghiem tu vocab pool). "day" la YYYY-MM-DD theo gio Viet Nam, giong quy
-- uoc chung. Chi can PRIMARY KEY (user_id, day) de idempotent: goi complete
-- nhieu lan trong cung mot ngay khong cong XP lap.
CREATE TABLE IF NOT EXISTS daily_challenge (
  user_id TEXT NOT NULL REFERENCES users(id),
  day TEXT NOT NULL,
  xp_awarded INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, day)
);
