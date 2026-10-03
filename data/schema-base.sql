-- Schema goc TRUOC migration 0001 (cac bang tao tay tren D1 truoc khi co
-- data/migrations). Khong nam trong migrations_dir nen Cloudflare khong chay no
-- luc deploy; chi dung de dung D1 local tu con so 0:
--   pnpm exec wrangler d1 execute stitch-db --local --file data/schema-base.sql
--   pnpm migrate:local
-- Lay tu sqlite_master cua production, bo cac cot/bang do migration them sau.
-- Moi lenh deu IF NOT EXISTS nen chay lai tren DB da co bang cung vo hai.

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    level TEXT DEFAULT 'B1',
    level_progress INTEGER DEFAULT 0,
    language TEXT DEFAULT 'vi',
    gemini_config TEXT DEFAULT '{"voice": "neutral", "speed": 1.0, "personality": "friendly"}',
    password_hash TEXT,
    salt TEXT,
    last_active_date TEXT
);

CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    sub_title TEXT,
    status TEXT DEFAULT 'New',
    icon TEXT DEFAULT 'school',
    progress INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    is_done BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);

-- Dang 1-1 cu; 0001_vocab_many_to_many.sql chuyen sang vocab + lesson_vocab moi.
CREATE TABLE IF NOT EXISTS lesson_vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL REFERENCES lessons(id),
    term TEXT NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS saved_vocab (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    vocab_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'model'
    content TEXT NOT NULL,
    metadata TEXT, -- JSON for corrections/feedback
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS achievements (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    requirement_type TEXT NOT NULL, -- 'streak', 'xp', 'lessons_completed', 'words_learned'
    requirement_value INTEGER NOT NULL,
    reward_coins INTEGER DEFAULT 0,
    reward_xp INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_achievements (
    user_id TEXT NOT NULL,
    achievement_id TEXT NOT NULL,
    unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    is_claimed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (user_id, achievement_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (achievement_id) REFERENCES achievements(id)
);
