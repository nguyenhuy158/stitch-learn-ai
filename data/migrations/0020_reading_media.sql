-- Anh minh hoa (og:image) va audio SoundCloud lay tu trang bai goc.
ALTER TABLE reading_articles ADD COLUMN image_url TEXT NOT NULL DEFAULT '';
ALTER TABLE reading_articles ADD COLUMN audio_url TEXT NOT NULL DEFAULT '';
