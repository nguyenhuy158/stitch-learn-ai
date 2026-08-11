-- Moi lan choi 1 game ghi 1 dong; high score = MAX(score) theo (user_id, game).
-- Luu tung lan (khong upsert theo max) de sau con lam duoc lich su/thong ke neu can.
CREATE TABLE IF NOT EXISTS game_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id),
  game TEXT NOT NULL,
  score INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_game_scores_game_score ON game_scores(game, score DESC);
CREATE INDEX IF NOT EXISTS idx_game_scores_user_game ON game_scores(user_id, game);

-- Bat/tat tu doc am flashcard, mac dinh bat. Doi trong Ho so.
ALTER TABLE users ADD COLUMN flashcard_audio INTEGER DEFAULT 1;
