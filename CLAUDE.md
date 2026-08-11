# ai-english

## Deploy

Không chạy `wrangler deploy` local. Push lên `origin/main` là Cloudflare tự build & deploy (Workers Builds CI/CD).

## Tài liệu tham khảo (root, untracked)

3 file PDF ở root repo (Mai Lan Hương ngữ pháp, Oxford Picture Dictionary, Grammar in Use - Murphy): dùng làm tham khảo nội dung cho app (ngữ pháp/từ vựng), không phải asset app đọc trực tiếp. Không push lên remote — giữ untracked, không thêm gitignore.

### Cách đọc/trích ảnh+từ từ PDF (Oxford Picture Dictionary)

Máy này NixOS, không có `apt`. Không cài global — dùng `nix-shell -p <pkg> --run "..."` cho từng lệnh cần.

- `Oxford Picture Dictionary.pdf`: bản scan ảnh thuần (Image2PDF), KHÔNG có text layer, 238 trang, size trang ~245x316pt. Trang 1 mục lục có index theo chủ đề (Money, Clothing, Health...) kèm số trang.
- Render trang ra PNG: `nix-shell -p poppler-utils --run "pdftoppm -f <từ> -l <đến> -png -r 120 'Oxford Picture Dictionary.pdf' out-prefix"` — Read tool không tự gọi pdftoppm được (không thấy PATH của nix-shell), phải tự render ra file rồi Read cái PNG.
- Crop từng cụm từ/ảnh minh họa riêng ra khỏi trang: `nix-shell -p imagemagick --run "convert page.png -crop WxH+X+Y +repage out.png"` (đo toạ độ bằng cách Read cả trang trước, ước lượng vùng theo mắt).
- Quy trình lấy N từ cho web: render trang chủ đề cần → Read xem layout (mỗi mục có số thứ tự + từ tiếng Anh + nghĩa Việt có sẵn) → crop ảnh minh hoạ theo từng mục/nhóm → ghép thành data {word, nghĩa, ảnh} cho app dùng.
