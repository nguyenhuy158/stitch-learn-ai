# stitch-learn-ai

Cloudflare Worker (full-stack): serves static frontend assets + backend API.

Backend ban đầu được lấy lại từ bản đã deploy trên Cloudflare (bundled bằng esbuild) qua Cloudflare API, sau đó dịch ngược + tách lại thành hexagonal architecture (xem `## Cấu trúc` dưới). Frontend là React app thật trong `src/client` (Vite + Tailwind), build ra `public/` qua `pnpm build`. D1 schema có migration SQL đầy đủ trong `data/migrations/`.

## Cấu trúc (hexagonal)
```
src/
  domain/            business logic thuần, không đụng D1/HTTP/Mochi/jose trực tiếp
    usecases/        1 file / 1 hành động (login, getCurrentUser, sendChatMessage, ...)
    services/        passwordHasher (PBKDF2, thuần crypto, không I/O ngoài)
    errors.js        ValidationError, AuthError — router map ra HTTP status
  ports/index.js     JSDoc typedef mô tả interface (UserRepository, SessionPort, AiTutorPort...)
  adapters/          implement ports, chứa mọi I/O thật
    d1/              D1 queries (user/chat/lesson repository)
    jose/            ký/verify JWT phiên nội bộ (JWT SSO verify bằng @huyab/sso trong worker.js)
    mochi/           gọi Workers AI qua binding `env.AI` (persona "Mochi"), build prompt
    http/            router.js (map route -> usecase) + cookies.js
  worker.js          composition root: wire adapters vào usecases, export fetch handler
```
Đổi adapter (D1 -> KV, Mochi -> OpenAI, jose -> lib khác) không cần sửa `domain/`.

## Chức năng
- Auth: SSO (huyab.click, worker `sso` tại `auth.huyab.click`) + email/password, JWT (jose), lưu D1
- Streak học tập
- `/api/lessons` — danh sách bài học (D1)
- `/api/lessons/:id` — chi tiết 1 bài học (vocab list), generate qua Mochi lần đầu rồi cache vào D1 (`lesson_vocab`)
- `/api/chat` — chat luyện ngôn ngữ, gọi Workers AI (model mặc định `@cf/meta/llama-3.3-70b-instruct-fp8-fast`), lưu lịch sử D1
- `/api/chat/history`
- `/api/user/update`
- `/api/writing/review` — sửa lỗi văn viết tiếng Anh qua Mochi (câu đã sửa + chi tiết từng lỗi + nhận xét chung), không lưu D1
- `/api/vocab`, `/api/vocab/saved`, `/api/vocab/:id/save`, `/api/rankings` — flashcards/saved/rankings (xem `## Home cards`)
- Fallback: serve static assets (SPA) qua `env.ASSETS`

`/api/user/password` bị retire (410 Gone) — xem `## Đổi mật khẩu (đã bỏ)`.

## Trang chi tiết bài học (2026-08-10)
`public/lesson.html?id=<lessonId>` — trang tĩnh riêng (không phải part của SPA React chính, vì repo chỉ có bundle build sẵn đã minify, không sửa được để thêm route/onClick). Responsive mobile + desktop (breakpoint 768px/1100px), tự fetch `/api/lessons/:id`.

**Nút "Tiếp tục"/click item trong `/lessons` giờ đã có tác dụng** — không sửa được bundle React nên vá bằng cách chèn 1 script trong `index.html` (global click listener + `/api/lessons` để map click theo text/vị trí DOM sang `/lesson.html?id=X`). Xem comment trong `public/index.html`. Rủi ro: nếu bundle sau này đổi cấu trúc DOM, script này có thể không match đúng nữa.

Data `lessons` từng bị duplicate (60 dòng cho 4 bài, do seed script lỗi) — đã dedupe về đúng 4 dòng (`id` 1-4) trên D1 prod ngày 2026-08-10.

## Trang sửa lỗi viết (2026-08-10)
`public/writing.html` — card "Sửa lỗi viết" (trong "Gợi ý cho bạn" ở `/lessons`) không có route/handler nào từ trước cả (khác lesson detail — cái này thực sự chưa tồn tại, không phải thiếu route cho data có sẵn), nên build mới hoàn toàn: textarea nhập đoạn văn, gọi `/api/writing/review`, hiển thị bản đã sửa + từng lỗi cụ thể + nhận xét chung. Không lưu lịch sử (stateless, mỗi lần gọi Mochi mới). Responsive mobile/desktop giống `lesson.html`. Gắn click vào card qua cùng script vá trong `index.html`.

## Trang lịch sử thật (2026-08-10)
`public/history.html` thay hoàn toàn trang "Lịch sử" mock cứng của bundle React (số liệu 12h30m/45 bài/8.5 điểm... toàn bộ là fake, không gọi API nào). Trang mới dùng data thật: `/api/auth/me` (streak, xp, level, level_progress) + `/api/chat/history` (ghép cặp user/model message thành từng lượt hội thoại, group theo ngày, đếm số lỗi từ `metadata.corrections` của mỗi reply).

Cách gắn vào: file tĩnh này tự nằm ở clean URL `/history` (Cloudflare tự strip `.html`) — **trùng đúng path route SPA cũ dùng**. Full-page navigation (sidebar `<a href="/history">`, "Xem tất cả" ở Home) tự nhiên load file thật này, không cần đổi gì. Riêng nút "Lịch sử" ở bottom nav mobile dùng client-side routing nội bộ của React (không có network request) nên vẫn sẽ hiện trang mock cũ nếu không chặn — script vá trong `index.html` bắt click đó và ép `location.href = "/history"` (full reload) để luôn ra trang thật.

Trang mock cũ trong bundle vẫn còn tồn tại về mặt code (không xoá được), chỉ là không còn đường nào trong UI dẫn tới nó nữa.

## Trợ giúp & Phản hồi (2026-08-10)
2 nút chết trên `/profile` đã sửa:
- Gear icon góc header: trước không mở gì cả (verify qua devtools) — giờ scroll xuống section "Cài đặt & Tùy chọn" thay vì để chết, vì nó vốn trùng chức năng với section đó.
- Modal "Trợ giúp & Phản hồi": bundle render ra sheet **hoàn toàn rỗng** (không có nội dung nào cả). Chặn click trước khi React mở modal đó, chuyển sang `public/help.html` (FAQ tĩnh + form gửi phản hồi thật qua `POST /api/feedback`, lưu bảng `feedback` mới trên D1).

## Home cards (2026-08-10)
Home page có 1 khối UI hoàn toàn chưa test/gắn trước đó (nằm dưới màn hình, phải scroll mới thấy) — "Gemini Suggests" (nay là gợi ý của Mochi) (Pronunciation Fix, Mistake Review, Coffee Chat) và "Learning Tools" (AI Tutor, Flashcards, Saved, Rankings). Không nút nào có handler trong bundle. Đã gắn hết:

- **AI Tutor**, **Pronunciation Fix → Start**, **Coffee Chat → Start**: đều dẫn về `/chat` (AI Chat có sẵn) — không có backend riêng cho luyện phát âm hay roleplay tình huống, AI Chat là tính năng hội thoại thật gần nhất.
- **Mistake Review → Start**: `public/mistakes.html` — tổng hợp lỗi ngữ pháp thật từ `metadata.corrections` trong lịch sử chat (`/api/chat/history`), không cần route backend mới.
- **Flashcards**: `public/flashcards.html` + `GET /api/vocab` — lật thẻ từ vựng, gộp từ tất cả bài học đã tạo nội dung (không tính bài `is_locked`), **chỉ đọc data đã cache sẵn, không gọi Mochi mới**. Có nút ★ lưu từ.
- **Saved**: `public/saved.html` + `GET /api/vocab/saved` + `POST /api/vocab/:id/save` (bảng `saved_vocab` mới) — danh sách từ đã lưu từ Flashcards, bỏ lưu được.
- **Rankings**: `public/rankings.html` + `GET /api/rankings` — xếp hạng theo `xp` thật. Trước đó **`xp` không có chỗ nào cộng cả** (luôn = 0 với mọi user) — đã thêm `+5 xp` mỗi lần chat AI Tutor và mỗi lần dùng Sửa lỗi viết (`userRepository.incrementXp`).

## Fix bug Start button (2026-08-10)
Test thật phát hiện bấm "Start" ở Pronunciation Fix lại nhảy sang `/mistakes.html` (đáng lẽ `/chat`). Nguyên nhân: script vá đi ngược DOM tìm ancestor chứa "Mistake Review" tới 6 cấp — 3 card share 1 container chung, nên đi quá xa lên tới container đó lúc nào cũng match "Mistake Review" dù đang bấm Pronunciation Fix hay Coffee Chat. Sửa: dừng ở ancestor đầu tiên có nhắc tên bất kỳ 1 trong 3 card (không riêng Mistake Review), rồi mới xét đúng card nào.

## Avatar mặc định (2026-08-10)
Dùng `@dicebear/core` + `@dicebear/collection` (style `funEmoji`) — cùng lib/kiểu với repo `chia-keo` (`src/components/Avatar.tsx`, xem `docs/avatar-libs.md` ở đó để biết lý do chọn DiceBear thay vì boring-avatars/multiavatar). Sinh SVG data URI thuần server-side, deterministic theo email — không cần lưu thêm cột "kiểu avatar" nào.

Chỉ áp dụng khi Google không trả `picture` (hoặc user tương lai không qua Google). Đã backfill cho user hiện có (`picture` từng `null`) trên D1 prod.

## Đổi mật khẩu (đã bỏ, 2026-08-10)
`changePassword` usecase + `updatePassword` repo method đã xoá. `/api/user/password` trả `410` cho mọi request — SSO là cách đăng nhập duy nhất được hỗ trợ giờ. Đăng nhập bằng password cũ (`/api/auth/login`) vẫn giữ (user hiện có vẫn login được), chỉ bỏ khả năng đổi/đặt mật khẩu mới. Menu "Thiết lập mật khẩu" trong bundle cũ vẫn hiện (không xoá được UI), nhưng bấm vào sẽ nhận lỗi rõ ràng thay vì lỗi ngầm.

## Auth qua SSO (2026-08-10)
Không tự làm Google OAuth nữa, dùng chung SSO worker `auth.huyab.click`:
- `/api/auth/google` chỉ redirect sang `${SSO_ISSUER}/login?redirect_uri=<origin>/`
- SSO tự xử lý Google OAuth, set cookie `huyab_sso` (JWT RS256) scope `.huyab.click`, redirect về app
- `/api/auth/me` đọc cookie `huyab_sso`, verify bằng JWKS remote (`${SSO_ISSUER}/.well-known/jwks.json`, không cần secret chung), upsert user vào D1, rồi mint session `auth_token` cục bộ (giữ nguyên luồng cũ cho các route khác)
- Yêu cầu: worker này phải chạy dưới subdomain `*.huyab.click` (đang là `en.huyab.click`) để cookie share được
- Không cần quản lý `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` ở repo này nữa — SSO giữ luôn

## Secrets cần set (không lưu trong repo)
Set bằng `wrangler secret put <tên>`:
- `JWT_SECRET`

Không cần API key cho AI: Mochi chạy trên Workers AI qua binding `env.AI`.
Vars trong `wrangler.jsonc`: `MOCHI_MODEL` (đổi model), `AI_GATEWAY` (tên AI
Gateway đã tạo sẵn, để trống thì gọi thẳng).

## Deploy
Không chạy `wrangler deploy` local. Push lên `origin/main` là Cloudflare tự build & deploy (Workers Builds CI/CD).
