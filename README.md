# stitch-learn-ai

Cloudflare Worker (full-stack): serves static frontend assets + backend API.

Code trong `worker.js` được lấy lại từ bản đã deploy trên Cloudflare (bundled bằng esbuild) qua Cloudflare API — **không phải source gốc** (không tách file, không có React/Vite source cho frontend, không có D1 migration SQL).

## Chức năng
- Auth: Google OAuth + email/password, JWT (jose), lưu D1
- Streak học tập
- `/api/lessons` — danh sách bài học (D1)
- `/api/chat` — chat luyện ngôn ngữ, gọi Gemini API (model mặc định `gemini-2.5-flash`), lưu lịch sử D1
- `/api/chat/history`
- `/api/user/update`, `/api/user/password`
- Fallback: serve static assets (SPA) qua `env.ASSETS`

## Security fixes áp dụng (2026-08-10)
- OAuth `state` giờ ký JWT (10 phút hạn) chứa `origin`, verify ở callback thay vì tin trực tiếp `Referer`/query string → chống CSRF + open-redirect.
- Redirect sau login chỉ cho phép origin nằm trong `ALLOWED_ORIGINS` (env, phân tách bằng dấu phẩy; mặc định origin của request).
- Bỏ các `console.log` lộ email/user id/cookie state; giữ `console.error` không chứa PII.

## Cần bù lại để deploy được từ repo này
- `wrangler.jsonc`: `database_id` đã điền đúng D1 thật (`stitch-db`)
- Secrets (không lấy được từ Cloudflare API, cần set lại bằng `wrangler secret put`):
  - `JWT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `GEMINI_API_KEY`
- D1 schema (`users`, `chat_messages`, bảng lessons...) chưa có migration file — cần dump từ D1 thật hoặc viết lại
- `public/` hiện chỉ có file placeholder — frontend build output gốc không lấy lại được, cần build lại và bỏ vào đây

## Deploy
```
wrangler deploy
```
