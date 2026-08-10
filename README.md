# stitch-learn-ai

Cloudflare Worker (full-stack): serves static frontend assets + backend API.

Backend được lấy lại từ bản đã deploy trên Cloudflare (bundled bằng esbuild) qua Cloudflare API, sau đó dịch ngược + tách lại thành hexagonal architecture (xem `## Cấu trúc` dưới) — **không phải source gốc 1:1** (source gốc là 1 file `src/worker.ts` duy nhất). Không có React/Vite source cho frontend, không có D1 migration SQL.

## Cấu trúc (hexagonal)
```
src/
  domain/            business logic thuần, không đụng D1/HTTP/Gemini/jose trực tiếp
    usecases/        1 file / 1 hành động (login, getCurrentUser, sendChatMessage, ...)
    services/        passwordHasher (PBKDF2, thuần crypto, không I/O ngoài)
    errors.js        ValidationError, AuthError — router map ra HTTP status
  ports/index.js     JSDoc typedef mô tả interface (UserRepository, SessionPort, AiTutorPort...)
  adapters/          implement ports, chứa mọi I/O thật
    d1/              D1 queries (user/chat/lesson repository)
    jose/            ký/verify JWT nội bộ + verify JWKS remote của SSO
    gemini/          gọi Gemini API, build prompt
    http/            router.js (map route -> usecase) + cookies.js
  worker.js          composition root: wire adapters vào usecases, export fetch handler
```
Đổi adapter (D1 -> KV, Gemini -> OpenAI, jose -> lib khác) không cần sửa `domain/`.

## Chức năng
- Auth: SSO (huyab.click, worker `sso` tại `auth.huyab.click`) + email/password, JWT (jose), lưu D1
- Streak học tập
- `/api/lessons` — danh sách bài học (D1)
- `/api/lessons/:id` — chi tiết 1 bài học (vocab list), generate qua Gemini lần đầu rồi cache vào D1 (`lesson_vocab`)
- `/api/chat` — chat luyện ngôn ngữ, gọi Gemini API (model mặc định `gemini-2.5-flash`), lưu lịch sử D1
- `/api/chat/history`
- `/api/user/update`
- `/api/writing/review` — sửa lỗi văn viết tiếng Anh qua Gemini (câu đã sửa + chi tiết từng lỗi + nhận xét chung), không lưu D1
- Fallback: serve static assets (SPA) qua `env.ASSETS`

`/api/user/password` bị retire (410 Gone) — xem `## Đổi mật khẩu (đã bỏ)`.

## Trang chi tiết bài học (2026-08-10)
`public/lesson.html?id=<lessonId>` — trang tĩnh riêng (không phải part của SPA React chính, vì repo chỉ có bundle build sẵn đã minify, không sửa được để thêm route/onClick). Responsive mobile + desktop (breakpoint 768px/1100px), tự fetch `/api/lessons/:id`.

**Nút "Tiếp tục"/click item trong `/lessons` giờ đã có tác dụng** — không sửa được bundle React nên vá bằng cách chèn 1 script trong `index.html` (global click listener + `/api/lessons` để map click theo text/vị trí DOM sang `/lesson.html?id=X`). Xem comment trong `public/index.html`. Rủi ro: nếu bundle sau này đổi cấu trúc DOM, script này có thể không match đúng nữa.

Data `lessons` từng bị duplicate (60 dòng cho 4 bài, do seed script lỗi) — đã dedupe về đúng 4 dòng (`id` 1-4) trên D1 prod ngày 2026-08-10.

## Trang sửa lỗi viết (2026-08-10)
`public/writing.html` — card "Sửa lỗi viết" (trong "Gợi ý cho bạn" ở `/lessons`) không có route/handler nào từ trước cả (khác lesson detail — cái này thực sự chưa tồn tại, không phải thiếu route cho data có sẵn), nên build mới hoàn toàn: textarea nhập đoạn văn, gọi `/api/writing/review`, hiển thị bản đã sửa + từng lỗi cụ thể + nhận xét chung. Không lưu lịch sử (stateless, mỗi lần gọi Gemini mới). Responsive mobile/desktop giống `lesson.html`. Gắn click vào card qua cùng script vá trong `index.html`.

## Trang lịch sử thật (2026-08-10)
`public/history.html` thay hoàn toàn trang "Lịch sử" mock cứng của bundle React (số liệu 12h30m/45 bài/8.5 điểm... toàn bộ là fake, không gọi API nào). Trang mới dùng data thật: `/api/auth/me` (streak, xp, level, level_progress) + `/api/chat/history` (ghép cặp user/model message thành từng lượt hội thoại, group theo ngày, đếm số lỗi từ `metadata.corrections` của mỗi reply).

Cách gắn vào: file tĩnh này tự nằm ở clean URL `/history` (Cloudflare tự strip `.html`) — **trùng đúng path route SPA cũ dùng**. Full-page navigation (sidebar `<a href="/history">`, "Xem tất cả" ở Home) tự nhiên load file thật này, không cần đổi gì. Riêng nút "Lịch sử" ở bottom nav mobile dùng client-side routing nội bộ của React (không có network request) nên vẫn sẽ hiện trang mock cũ nếu không chặn — script vá trong `index.html` bắt click đó và ép `location.href = "/history"` (full reload) để luôn ra trang thật.

Trang mock cũ trong bundle vẫn còn tồn tại về mặt code (không xoá được), chỉ là không còn đường nào trong UI dẫn tới nó nữa.

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

## Cần bù lại để deploy được từ repo này
- `wrangler.jsonc`: `database_id` đã điền đúng D1 thật (`stitch-db`)
- Secrets (không lấy được từ Cloudflare API, cần set lại bằng `wrangler secret put`):
  - `JWT_SECRET`
  - `GEMINI_API_KEY`
- D1 schema (`users`, `chat_messages`, bảng lessons...) chưa có migration file — cần dump từ D1 thật hoặc viết lại
- `public/` hiện chỉ có file placeholder — frontend build output gốc không lấy lại được, cần build lại và bỏ vào đây

## Deploy
```
wrangler deploy
```
