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

## 2. freeDictionaryAPI (dictionaryapi.dev) — definition + audio phát âm

- https://github.com/meetDeveloper/freeDictionaryAPI — `GET https://api.dictionaryapi.dev/api/v2/entries/en/<word>`, không cần key.
- Kế hoạch: gọi trong `lookupWord` trước/bổ sung Mochi: lấy `phonetics[].audio`
  (URL mp3 đọc từ thật) + definitions/synonyms. Thêm cột `audio_url` vào `word_lookups`,
  popup tra từ phát audio thật thay speechSynthesis khi có.

## 3. Oxford 5000 + CEFR level — mở rộng kho từ đang có (Oxford 3000 đã seed)

- https://github.com/ittuann/The-Oxford-5000-Word-Lists (TXT theo CEFR)
- https://github.com/winterdl/oxford-5000-vocabulary-audio-definition (JSON/CSV kèm definition, audio, example)
- Kế hoạch: script sinh migration seed như 0002–0006, thêm cột `cefr_level` vào bảng vocab.
  Mở khóa: lọc flashcards/games theo level A1–C1, hiện badge level khi tra từ.

## 4. ipa-dict / cmudict-ipa — IPA offline cho trang phiên âm

- https://github.com/open-dict-data/ipa-dict (US + UK, JSON/CSV), https://github.com/menelik3/cmudict-ipa (134k từ US).
- Kế hoạch: seed bảng `ipa_entries(word, ipa_us, ipa_uk)` vào D1 (~vài MB, chia nhiều migration
  hoặc import bằng `wrangler d1 execute --file`). Trang IPA transcribe tra D1 trước, chỉ từ
  không có mới hỏi AI. Client `lookupIpa` giữ nguyên, đổi backend.

## 5. Words-CEFR-Dataset / olp-en-cefrj — chấm độ khó

- https://github.com/Maximax67/Words-CEFR-Dataset, https://github.com/openlanguageprofiles/olp-en-cefrj
- Kế hoạch (sau cùng): map từ → CEFR + tần suất để (a) gắn nhãn level từ user tra,
  (b) ước lượng độ khó bài đọc News in Levels, (c) ưu tiên từ hay gặp khi sinh flashcards.

## Thứ tự làm

1. ✅ Tatoeba (câu ví dụ trong popup tra từ)
2. freeDictionaryAPI (audio + definition thật cho lookup)
3. Oxford 5000 seed + cefr_level
4. ipa-dict seed
5. CEFR dataset chấm độ khó
