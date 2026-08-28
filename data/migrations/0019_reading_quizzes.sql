-- Quiz doc hieu do Mochi sinh cho tung bai doc, cache de 1 bai chi ton 1 call AI.
CREATE TABLE IF NOT EXISTS reading_quizzes (
  guid TEXT PRIMARY KEY,     -- guid bai doc (reading_articles.guid)
  questions TEXT NOT NULL,   -- JSON [{question, choices[4], answer, explanation}]
  created_at TEXT NOT NULL
);
