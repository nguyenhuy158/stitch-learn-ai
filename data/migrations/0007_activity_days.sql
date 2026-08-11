-- Mot dong = mot NGAY nguoi dung co hoc that (chat, sua bai viet, luu tu,
-- mo bai hoc). Truoc day streak dua vao users.last_active_date, ma cot do
-- lai duoc cap nhat trong GET /api/auth/me — nghia la chi can mo app la
-- streak tang, khong hoc gi van len. Bang nay ghi hoat dong hoc that su,
-- dong thoi cho phep ve dung 7 o trong tuan tren trang chu.
CREATE TABLE IF NOT EXISTS activity_days (
  user_id TEXT NOT NULL REFERENCES users(id),
  day TEXT NOT NULL,          -- YYYY-MM-DD theo gio Viet Nam
  PRIMARY KEY (user_id, day)
);

CREATE INDEX IF NOT EXISTS idx_activity_days_user_day ON activity_days(user_id, day DESC);
