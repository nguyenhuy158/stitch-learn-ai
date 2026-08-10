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
- `/api/user/update`, `/api/user/password`
- Fallback: serve static assets (SPA) qua `env.ASSETS`

## Trang chi tiết bài học (2026-08-10)
`public/lesson.html?id=<lessonId>` — trang tĩnh riêng (không phải part của SPA React chính, vì repo chỉ có bundle build sẵn đã minify, không sửa được để thêm route/onClick). Responsive mobile + desktop (breakpoint 768px/1100px), tự fetch `/api/lessons/:id`.

**Chưa gắn vào list bài học cũ** (nút "Tiếp tục"/click item trong `/lessons` hiện không có handler nào — bug có từ code gốc, không phải do route thiếu). Muốn dùng thì mở trực tiếp `/lesson.html?id=1` (id lấy từ `/api/lessons`).

Data `lessons` từng bị duplicate (60 dòng cho 4 bài, do seed script lỗi) — đã dedupe về đúng 4 dòng (`id` 1-4) trên D1 prod ngày 2026-08-10.

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
