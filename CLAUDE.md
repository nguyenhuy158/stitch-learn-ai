# ai-english

Dùng pnpm cho repo này (không npm/yarn).

## Deploy

Không chạy `wrangler deploy` local. Push lên `origin/main` là Cloudflare tự build & deploy (Workers Builds CI/CD).

## Build assets (public/assets/) — Vite build ở Cloudflare

### Vấn đề

`pnpm build` (Vite) rewrite `public/index.html` để tham chiếu hash file
mới trong `public/assets/`. Nếu commit `index.html` mà KHÔNG commit
assets → Cloudflare deploy trang trỏ tới file không tồn tại → 500
(đã xảy ra 2026-08-29, fix ở commit `03de124`).

### Workflow hiện tại (Dashboard chưa bật auto-build)

```
pnpm build
git add public/index.html public/assets/
git commit -m "..."
```

### Cách bật auto-build ở Cloudflare (1 lần, làm thủ công trong Dashboard)

1. Vào https://dash.cloudflare.com → Workers & Pages → chọn worker `ai-english`
2. Tab **Settings** → **Builds** → **Build configuration**
3. **Build command**: `pnpm install --frozen-lockfile && pnpm build`
4. **Build output directory**: `./public` (giữ nguyên, vì wrangler.jsonc
   `assets.directory = ./public`)
5. Bật **Enable builds** nếu chưa
6. Save

Sau bước này, mỗi lần push:
- Cloudflare chạy `pnpm install` (cache `.pnpm-store` 7 ngày, 10GB)
- Cloudflare chạy `pnpm build` → Vite sinh `index.html` + `public/assets/`
- Cloudflare deploy

**Sau khi bật auto-build, chạy 1 lần để dọn git:**

```
git rm --cached -r public/assets/
echo 'public/assets/' >> .gitignore
git add .gitignore
git commit -m "chore: untrack Vite output (Cloudflare builds now)"
```

Từ đó KHÔNG commit `public/assets/` nữa, chỉ commit `src/` + `public/index.html`.

### Migration D1

`pnpm dev` chỉ chạy local. Mỗi migration SQL mới
(`data/migrations/00XX_*.sql`) **phải apply remote bằng tay**:

```
npx wrangler d1 execute stitch-db --remote --file=data/migrations/00XX_xxx.sql
```

Không có bước này → code mới reference table chưa tồn tại → runtime error / 500.
Cloudflare Workers Builds KHÔNG chạy D1 migration tự động.
## Tài liệu tham khảo (root, untracked)

Máy này NixOS, không có `apt`. Không cài global — dùng `nix-shell -p <pkg> --run "..."` cho từng lệnh cần.

- `Oxford Picture Dictionary.pdf`: bản scan ảnh thuần (Image2PDF), KHÔNG có text layer, 238 trang, size trang ~245x316pt. Trang 1 mục lục có index theo chủ đề (Money, Clothing, Health...) kèm số trang.
- Render trang ra PNG: `nix-shell -p poppler-utils --run "pdftoppm -f <từ> -l <đến> -png -r 120 'Oxford Picture Dictionary.pdf' out-prefix"` — Read tool không tự gọi pdftoppm được (không thấy PATH của nix-shell), phải tự render ra file rồi Read cái PNG.
- Crop từng cụm từ/ảnh minh họa riêng ra khỏi trang: `nix-shell -p imagemagick --run "convert page.png -crop WxH+X+Y +repage out.png"` (đo toạ độ bằng cách Read cả trang trước, ước lượng vùng theo mắt).
- Quy trình lấy N từ cho web: render trang chủ đề cần → Read xem layout (mỗi mục có số thứ tự + từ tiếng Anh + nghĩa Việt có sẵn) → crop ảnh minh hoạ theo từng mục/nhóm → ghép thành data {word, nghĩa, ảnh} cho app dùng.
- Trang PDF thật = trang in sách + 10 (vd trang in "20 Money" = pdf page 30). Trang 1-9 là bìa/lời tựa/mục lục (Contents ở pdf page 9-11).
- Render kỹ (crop riêng từng icon 1 từ) nên dùng `-r 250` trở lên, r120 đủ để đọc chữ nhưng crop lẻ bị vỡ nét. Muốn crop chính xác từng ô, cần crop 2 bước: (1) crop cả cụm minh hoạ lớn từ trang gốc, Read lại xem toạ độ, (2) crop tiếp từng ô nhỏ trong cụm đó.
- Hạn chế: 1 số trang minh hoạ các vật chồng lên nhau theo góc nghiêng (vd trang Money mục 7-12 tiền giấy) — crop riêng từng tờ không tách sạch được, ảnh sẽ dính 1 phần vật bên cạnh. Trang kiểu list riêng biệt (vd Colors — mỗi màu 1 hộp) crop sạch hơn nhiều.
- Cấu trúc sách: 12 chương lớn (Everyday Language, People, Housing, Food, Clothing, Health, Community, Transportation, Areas of Study, Plants and Animals, Work, Recreation), ~140 topic nhỏ (mỗi topic 1-2 trang), hơn 3700 từ, tới pdf page ~183 (in trang 173) rồi tới Verb Guide + Index.
- Ảnh crop ra đang lưu ở scratchpad (`/tmp/claude-*/.../scratchpad/`) — mất khi hết session, chưa vào repo. Cần move vào repo (vd `public/vocab-images/`) hoặc up thẳng R2 nếu muốn giữ lâu dài.
- Prod nên lưu ảnh vocab trên Cloudflare R2 (free tier 10GB storage, 1M Class A + 10M Class B request/tháng, không tính egress) thay vì bundle vào Worker assets, fetch qua R2 binding.
