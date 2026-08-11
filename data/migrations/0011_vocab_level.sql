-- CEFR level (A1/A2/B1/B2/C1/C2) cho tung tu, dung de chon do dung cho
-- Word Game (de/kho/huyen thoai). NULL = chua duoc gan, se duoc backfill
-- bang mot lan goi Workers AI qua route admin tam thoi.
ALTER TABLE vocab ADD COLUMN level TEXT;

CREATE INDEX IF NOT EXISTS idx_vocab_level ON vocab(level);
