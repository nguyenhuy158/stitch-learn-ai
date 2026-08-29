# Plan tích hợp nguồn open source về tiếng Anh

Nguyên tắc chung: toàn data + fetch, không thêm npm dependency. Nguồn ngoài luôn
đi qua port + cache D1 (pattern như `wordLookupCacheRepository`), lỗi nguồn ngoài
không được làm hỏng tính năng.

## 1. Tatoeba — câu ví dụ thật có bản dịch tiếng Việt ✅ (đã làm)

- Nguồn: https://github.com/Tatoeba — API `https://api.tatoeba.org/unstable/sentences?lang=eng&q=<từ>&trans:lang=vie&sort=relevance&limit=…` (license câu: CC BY 2.0 FR).
- Tích hợp: adapter `src/adapters/tatoeba/examples.js`, cache D1 `example_sentences`
  (migration 0021), endpoint `GET /api/word/examples?term=`, hiện trong popup tra từ
  của `ClickableSentence` (EN + nghĩa Việt).
- Sau này: dùng câu Tatoeba làm câu hỏi cho games (scramble, translation) thay câu AI bịa.

## 2. freeDictionaryAPI (dictionaryapi.dev) — definition + audio phát âm ✅ (đã làm)

- https://github.com/meetDeveloper/freeDictionaryAPI — `GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>`, không cần key.
- Tích hợp: adapter `src/adapters/dictionaryapi/dictionary.js`, gọi song song với Mochi
  trong `lookupWord`: audio mp3 đọc từ thật (cột `audio_url`, migration 0022) + synonyms/antonyms
  bổ sung khi Mochi trả rỗng. `SpeakButton` nhận `audioUrl`, phát mp3 thật, lỗi rớt về speechSynthesis.

## 3. Oxford 5000 + CEFR level — mở rộng kho từ đang có (Oxford 3000 đã seed)

- https://github.com/ittuann/The-Oxford-5000-Word-Lists (TXT theo CEFR)
- https://github.com/winterdl/oxford-5000-vocabulary-audio-definition (JSON/CSV kèm definition, audio, example)
- ✅ Đã làm (migration 0023 + 0024, nguồn winterdl): backfill `vocab.level` (cột có sẵn từ 0011)
  cho 2963 từ Oxford 3000, seed 1991 từ mới (nghĩa tiếng Anh + level) vào lesson "Oxford 5000",
  badge level trong popup tra từ (`getTermLevel` ở savedVocabRepository, gắn vào lookupWord).
  Còn mở: lọc flashcards/games theo level A1–C1 (games đã dùng `vocab.level` qua DIFFICULTY_LEVELS).

## 4. ipa-dict / cmudict-ipa — IPA offline cho trang phiên âm

- https://github.com/open-dict-data/ipa-dict (US + UK, JSON/CSV), https://github.com/menelik3/cmudict-ipa (134k từ US).
- ✅ Đã có sẵn từ trước, không cần D1: full en_US dataset (~126k từ, 4.9MB) serve làm static asset
  `public/data/ipa-dictionary.json`, client `lookupIpa`/`transcribeToIpa` tra offline hoàn toàn.

## 5. Words-CEFR-Dataset / olp-en-cefrj — chấm độ khó

- https://github.com/Maximax67/Words-CEFR-Dataset, https://github.com/openlanguageprofiles/olp-en-cefrj
- ✅ Đã làm phần (a): `public/data/word-cefr.json` (172k từ → A1–C2, 2.7MB, sinh từ Maximax67
  words.csv + word_pos.csv, lấy level thấp nhất giữa các POS, làm tròn 1–6 → A1–C2). Client
  `lookupCefr` (src/client/lib/cefr.ts) cùng pattern ipa-dictionary; popup tra từ fallback sang
  map này khi kho vocab chưa có level. (b) độ khó bài đọc News in Levels đã có level 1–3 từ nguồn,
  (c) ưu tiên tần suất khi sinh flashcards — bỏ, chưa cần.

## Thứ tự làm

1. ✅ Tatoeba (câu ví dụ trong popup tra từ)
2. ✅ freeDictionaryAPI (audio + definition thật cho lookup)
3. ✅ Oxford 5000 seed + level CEFR
4. ✅ ipa-dict (đã có sẵn dạng static asset, không cần seed D1)
5. ✅ CEFR dataset chấm độ khó (word-cefr.json + lookupCefr, badge level cho mọi từ)
