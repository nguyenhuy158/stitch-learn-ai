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
- ✅ Đã làm (nguồn winterdl): backfill `vocab.level` (cột có sẵn từ 0011)
  cho từ Oxford 3000, seed 1990 từ mới vào lesson "Oxford 5000",
  Migration đã chạy remote là **0026_seed_oxford5000_vi.sql** (nghĩa tiếng Việt tự soạn + level chính thức);
  0023_oxford5000_cefr_backfill / 0024_seed_oxford5000 (nghĩa tiếng Anh) chưa chạy remote, để tham khảo — 0024 toàn ON CONFLICT DO NOTHING nên chạy cũng vô hại.
  badge level trong popup tra từ (`getTermLevel` ở savedVocabRepository, gắn vào lookupWord).
  ✅ Lọc theo level: games qua DIFFICULTY_LEVELS, flashcards có chip lọc A1–C2 + badge level trên thẻ.

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

## 6. SUBTLEX-US — word frequency thật từ 8.4M phụ đề 🎯 Tier 1 (chưa làm)

- Nguồn: https://github.com/words/subtlex-us — file `SUBTLEXus74286.txt` (CSV 60k từ, frequency + Zipf từ 8.4M phụ đề phim Mỹ, license CC BY 4.0).
- Tích hợp dự kiến: download CSV 1 lần, sinh D1 `word_frequency (term PRIMARY KEY, freq_count INTEGER, log10wf REAL, zipf REAL, rank INTEGER)` qua migration 0027. Endpoint `GET /api/word/frequency?term=` trả rank trong khoảng 1-60000. Tính rank bằng `ORDER BY freq_count DESC` lúc seed (không tính runtime).
- Dùng cho: flashcard có chip "phổ biến thứ #N", sort vocab theo tần suất thật thay vì alphabet/CEFR. Oxford 5000 chỉ cho biết từ "quan trọng theo chương trình" — SUBTLEX cho biết từ "người Mỹ thật nói hằng ngày" (kết quả khác nhau đáng kể, ví dụ "yeah/okay/gonna" không có trong Oxford nhưng rank cao trong SUBTLEX).
- Tại sao nên: file nhỏ (1MB CSV), seed 1 phát ~30s, cache vĩnh viễn. Không cần API runtime, không tốn AI.
- Effort: 15-30 phút (1 commit).

## 7. Open Library Definitions — etymology + cross-references 🎯 Tier 1 (chưa làm)

- Nguồn: https://openlibrary.org/dev/docs/api/search — `GET https://openlibrary.org/search.json?q=<word>&fields=key,definition,etymology,subject` không cần key.
- Tích hợp dự kiến: adapter `src/adapters/openlibrary/search.js`, gọi song song với Mochi trong `lookupWord` (giống pattern dictionaryapi). Cache D1 `openlibrary_cache (term PRIMARY KEY, definitions_json TEXT, etymology TEXT, fetched_at INTEGER)`, TTL 30 ngày. Khi Mochi trả etymology mơ hồ, fallback Open Library.
- Dùng cho: popup tra từ thêm section "Etymology" (gốc Latin/Greek/Old English), "Cross-references" (hyperlink tới các từ liên quan cùng root: `bene-`, `mal-`, `-tion`...). Khác với Mochi ở chỗ: Open Library lấy từ WordNet + Wiktionary đã được cộng đồng verify, Mochi hay bịa etymology.
- Tại sao nên: API miễn phí, không cần đăng ký, response time ~200ms, rate limit hào phóng.
- Trade-off: Open Library chỉ có definition tiếng Anh (không có tiếng Việt) → vẫn cần Mochi/dictionaryapi cho nghĩa Việt.
- Effort: 1-2 giờ (1 commit).

## 8. LanguageTool — grammar check rule-based (EN + VI) 🎯 Tier 1 (chưa làm)

- Nguồn: https://github.com/languagetool-org/languagetool — public API `POST https://api.languagetool.org/v2/check` (20 req/IP/min không cần key, license LGPL 2.1). Self-host Docker nếu cần scale.
- Tích hợp dự kiến: adapter `src/adapters/languagetool/check.js`, gọi trước/song song với Mochi ở `/api/writing/review`. Response có cấu trúc `matches[]` chứa `offset, length, rule.id, rule.description, message, replacements[]` → render thẳng lỗi có category (GRAMMAR/SPELLING/TYPOGRAPHY/STYLE...), không phải parse JSON tự do của Mochi.
- Dùng cho:
  - **Writing Review** (nâng cấp lớn): hiện Mochi sinh lỗi tự do, hay bịa rule. LanguageTool check dựa trên rule engine chuẩn (hơn 2000 rule cho EN, ~200 cho VI), trả về lỗi có `rule.id` → user bấm vào xem giải thích. Kết hợp: LanguageTool cho lỗi cấu trúc, Mochi cho nhận xét tổng thể/native phrasing.
  - **Tab "Lỗi của tôi"** ở `Mistakes.html`: thay vì chỉ dựa vào `metadata.corrections` của Mochi (hay false positive), gom cả lỗi LanguageTool qua nhiều lần review.
- Tại sao nên: khác biệt lớn nhất so với các app AI review. Rule engine không hallucinate, false positive rate thấp, user tin tưởng được.
- Trade-off: 20 req/min/IP public API, cần rate-limit handler (queue nếu user gửi nhiều). Nếu scale → self-host (Docker image ~200MB RAM, deploy Railway/Fly free tier).
- Effort: 3-4 giờ (UI render lỗi có cấu trúc + rate limit + cache).

## 9. Forvo — pronunciation audio người bản xứ 🎯 Tier 1 (chưa làm, cần cho Shadowing)

- Nguồn: https://forvo.com/ — API key miễn phí 500 req/ngày (đăng ký free). Audio do user upload, thuộc về contributor.
- Tích hợp dự kiến: adapter `src/adapters/forvo/pronunciation.js`, gọi khi `dictionaryapi` không có audio hoặc user chọn locale khác (en-US, en-GB, en-AU, en-CA). Cache D1 `pronunciation_audio (term, locale, audio_url, voice_gender, mp3_url, source, fetched_at)` — 1 từ có thể có 3-4 locale.
- Dùng cho:
  - Nâng cấp `SpeakButton` từ 1 voice (dictionaryapi) → nhiều locale US/GB/AU/CA. User chọn voice muốn nghe.
  - **FEATURE #2 Shadowing** cần audio chuẩn từ người thật để user đọc lại đối chiếu (TTS máy móc không đủ tốt cho luyện phát âm).
- Tại sao nên: dictionaryapi thường xuyên 404 audio (đặc biệt từ hiếm), Forvo có audio cho hầu hết từ phổ biến và nhiều locale.
- Trade-off: cần đăng ký API key (miễn phí nhưng phải verify email). 500 req/ngày nghĩa là cache kỹ + fallback. Có thể scrape trang word nếu hết quota (cẩn thận ToS).
- Effort: 2-3 giờ (API integration + UI chọn locale + cache).

## 10. Cambridge Dictionary Open Data (CSDL) 🎯 Tier 2 (chưa làm)

- Nguồn: https://github.com/CSDL-Cambridge/cambridge-dictionary-open-data — JSON definitions + IPA + examples (license Apache 2.0).
- Tích hợp dự kiến: download repo 1 lần, serve JSON files từ Cloudflare R2 (cache vĩnh viễn, không gọi runtime). Endpoint `GET /api/word/cambridge?term=` đọc R2, parse, trả về definition UK/US + IPA + examples.
- Dùng cho: drop-in replacement cho `dictionaryapi.dev` (đôi khi 404/rỗng). CSDL chất lượng Cambridge (gold standard cho learner dictionary).
- Tại sao nên: data chất lượng cao hơn dictionaryapi, offline serve được từ R2 (không tốn rate limit).
- Trade-off: dataset ~50MB JSON, cần bundle/index để tra nhanh (không scan toàn bộ). Có thể index theo alphabet.
- Effort: 2-3 giờ (R2 setup + index + adapter).

## 11. Common Voice — sentence audio người thật 🎯 Tier 2 (chưa làm, cần cho Dictation)

- Nguồn: https://commonvoice.mozilla.org/ — CC0 audio đọc câu từ 100k+ contributor, dataset `cv-corpus-*` theo locale.
- Tích hợp dự kiến: download `en-US` subset (~500h audio, 50GB nén), index theo transcript text, serve mp3 từ R2. Khi user làm **FEATURE #3 Dictation** với câu từ Tatoeba, tìm audio Common Voice match (substring trong transcript) → play audio người thật thay vì TTS.
- Dùng cho: FEATURE #3 Dictation — thay vì chỉ TTS (máy móc), nghe câu **người thật đọc** rồi chép lại. Tăng difficulty progression: level 1 = TTS rõ, level 2 = Common Voice tốc độ tự nhiên, level 3 = Common Voice + noise nền.
- Tại sao nên: CC0 (không lo license), audio chất lượng đa dạng (giọng vùng miền, tốc độ), dataset cực lớn.
- Trade-off: dataset 50GB, cần filter (chỉ lấy câu ngắn <15 từ + transcript match Tatoeba) → ~5-10GB. R2 storage cost ~$0.015/GB/tháng.
- Effort: 4-6 giờ (download + filter + index + R2 + endpoint tìm match).

## 12. TED Talks transcripts — listening comprehension 🎯 Tier 2 (chưa làm)

- Nguồn: https://www.ted.com/participate/translate + corpus tools https://github.com/sdoria/TED_corpus. Transcripts có CC BY-NC-ND 4.0.
- Tích hợp dự kiến: dùng TED public transcripts (XML hoặc scrape JSON endpoint), cache D1 `ted_talks (id, title, speaker, duration_sec, transcript_json, level, topics)`. Endpoint `GET /api/listening/ted?level=&topic=` trả danh sách + audio URL (link YouTube TED official).
- Dùng cho: thêm category "Nghe TED", chia theo level (CEFR mapping thủ công: ngắn + đơn giản = A2, dài + chuyên ngành = C1), theo topic (Tech/Science/Design). Transcript song ngữ (TED có bản dịch cộng đồng nhưng license khác → chỉ hiện EN transcript + dịch on-demand qua Mochi).
- Tại sao nên: content chất lượng cao, audio + transcript sync sẵn (có thể build karaoke-style reader), tạo category nghe dài hạn ngoài dictation/chat.
- Trade-off: CC BY-NC-ND → không được sửa/modify rồi phân phối lại. Có thể embed YouTube TED + dịch inline OK.
- Effort: 5-8 giờ (build pipeline + UI player + level mapping).

## 13. Project Gutenberg — classic books song ngữ 🎯 Tier 2 (chưa làm)

- Nguồn: https://gutendex.com/ — 50k+ sách public domain, API miễn phí.
- Tích hợp dự kiến: import sách theo level (dùng textstat/mean-word-frequency để auto-classify), cache D1 `gutenberg_books (id, title, author, level, word_count, content_url, cover_url)`. Endpoint `GET /api/reading/gutenberg?level=` liệt kê sách, `/api/reading/gutenberg/:id` trả full text.
- Dùng cho: thêm category "Đọc sách" ngoài News in Levels. Reading progress (track vị trí đang đọc), vocabulary in context (bôi từ chưa biết → popup tra). Sách cũ (Pride & Prejudice, Sherlock Holmes, Alice in Wonderland) ngôn ngữ literary hơn News → level B1-C1 tự nhiên.
- Tại sao nên: public domain (no license issue), content vô tận, tự động classify level được.
- Trade-off: text literary có thể khó cho beginner (cần filter theo level), cover image/format không đồng nhất (cần normalize).
- Effort: 6-8 giờ (gutendex integration + level classifier + reader UI).

## 14. Wiktionary parsed (dbnary) 🎯 Tier 2 (chưa làm)

- Nguồn: https://github.com/Kyubyong/db_creation — Dbnary trích Wiktionary thành RDF, có sẵn CSV/parquet. License CC BY-SA 4.0.
- Tích hợp dự kiến: download parquet files (definitions, etymologies, pronunciations, hyponyms) ~2GB nén → index theo term → serve từ R2. Cùng use case Open Library nhưng data lớn hơn, offline được.
- Tại sao nên: thay thế Open Library API (giảm rate limit risk), data đầy đủ hơn (mỗi từ có nhiều nghĩa theo POS, etymology chi tiết, derived terms).
- Trade-off: cùng use case với #7 Open Library, làm cái nào trước? → **làm Open Library trước** (API đơn giản, data vừa đủ), Wiktionary là upgrade nếu cần sâu hơn.
- Effort: 3-4 giờ (parse + index + adapter).

## 15. Vosk-browser — offline speech recognition 🎯 Tier 4 (chưa làm, cần cho Shadowing cross-browser)

- Nguồn: https://github.com/alphacep/vosk-browser — WASM port, model en-US ~50MB.
- Tích hợp dự kiến: lazy-load model khi user vào trang có mic (Shadowing FEATURE #2, Chat mic FEATURE #6). Hiện tại dùng Web Speech API (chỉ Chrome/Edge/Safari macOS, cần internet). Vosk chạy 100% client, support Firefox + Safari iOS + offline.
- Dùng cho: **FEATURE #2 Shadowing** + **FEATURE #6 Mic Chat** — transcript so với câu gốc, highlight đúng/sai. Web Speech API đang dùng work trên Chrome nhưng transcript kém chất lượng (đặc biệt giọng không native), Vosk cho kết quả tốt hơn + đa browser.
- Tại sao nên: 100% offline, đa browser, không cần Google servers.
- Trade-off: bundle +50MB (model phải download 1 lần, cache service worker). Cần kiểm tra bundle size budget (hiện tại React bundle đã ~500KB, +50MB là rất lớn). Có thể load từ CDN riêng (jsDelivr) thay vì bundle.
- Effort: 4-6 giờ (WASM integration + lazy load + UI feedback + model hosting).

## 16. eSpeak-ng (CLI) — IPA real-time cho cả câu 🎯 Tier 4 (chưa làm)

- Nguồn: https://github.com/espeak-ng/espeak-ng — CLI binary, 100+ ngôn ngữ, license GPL v3.
- Tích hợp dự kiến: chạy trong side service (Railway/Fly free tier, Docker image ~100MB). Endpoint `GET /api/ipa/phrase?text=&lang=en-us` sinh IPA cho cả câu (không giới hạn từ điển, kể cả từ tự nhiên/đường tên riêng).
- Dùng cho: nâng cấp trang **phiên âm** (FEATURE hiện có) — hiện `ipa-dictionary.json` chỉ tra được từ đơn, không tra được câu. eSpeak sinh IPA cho bất kỳ text nào.
- Tại sao nên: bỏ giới hạn từ điển IPA (hiện 126k từ, nhưng vẫn miss slang/proper nouns).
- Trade-off: **KHÔNG chạy được trong Cloudflare Worker** (eSpeak binary cần system call). Cần deploy riêng. Cost Railway free tier = $0 nếu <500h/tháng.
- Effort: 4-5 giờ (deploy side service + endpoint + fallback nếu service down).

## Thứ tự làm (cập nhật 2026-08-29)

### Đã xong (Tier 0)
1. ✅ Tatoeba (câu ví dụ trong popup tra từ)
2. ✅ freeDictionaryAPI (audio + definition thật cho lookup)
3. ✅ Oxford 5000 seed + level CEFR
4. ✅ ipa-dict (đã có sẵn dạng static asset, không cần seed D1)
5. ✅ CEFR dataset chấm độ khó (word-cefr.json + lookupCefr, badge level cho mọi từ)

### Đang làm (focus FEATURE #2 Shadowing)
6. 🎯 **#6 SUBTLEX-US frequency** — 15-30 phút (1 commit, foundation cho các feature ranking)
7. 🎯 **#7 Open Library** — 1-2 giờ (1 commit, etymology + cross-references)
8. 🎯 **#8 LanguageTool** — 3-4 giờ (1 commit, grammar check rule-based cho Writing Review)
9. 🎯 **#9 Forvo** — 2-3 giờ (1 commit, pronunciation audio multi-locale, cần cho Shadowing)
10. 🎯 **#15 Vosk-browser** — 4-6 giờ (1 commit, offline speech recognition, cần cho Shadowing cross-browser)

### Backlog (Tier 2, làm sau)
11. ⏳ #10 Cambridge Dictionary Open Data — 2-3 giờ
12. ⏳ #11 Common Voice — 4-6 giờ (cần cho Dictation)
13. ⏳ #12 TED Talks transcripts — 5-8 giờ
14. ⏳ #13 Project Gutenberg — 6-8 giờ
15. ⏳ #14 Wiktionary parsed (dbnary) — 3-4 giờ (upgrade nếu Open Library chưa đủ)
16. ⏳ #16 eSpeak-ng side service — 4-5 giờ (cần side service riêng)


