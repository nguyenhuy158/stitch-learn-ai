# stitch-learn-ai

Cloudflare Worker (full-stack): serves static frontend assets + backend API.

Code trong `worker.js` được lấy lại từ bản đã deploy trên Cloudflare (bundled bằng esbuild) qua Cloudflare API — **không phải source gốc** (không tách file, không có React/Vite source cho frontend, không có D1 migration SQL).

## Chức năng
- Auth: SSO (huyab.click, worker `sso` tại `auth.huyab.click`) + email/password, JWT (jose), lưu D1
- Streak học tập
- `/api/lessons` — danh sách bài học (D1)
- `/api/chat` — chat luyện ngôn ngữ, gọi Gemini API (model mặc định `gemini-2.5-flash`), lưu lịch sử D1
- `/api/chat/history`
- `/api/user/update`, `/api/user/password`
- Fallback: serve static assets (SPA) qua `env.ASSETS`

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
