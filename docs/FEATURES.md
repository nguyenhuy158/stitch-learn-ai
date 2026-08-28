# 7 feature mới (08/2026)

## 1. Quiz đọc hiểu sau bài đọc
Đọc xong bài `/reading`, bấm "Làm quiz" → Mochi sinh 4 câu trắc nghiệm hiểu bài
(tiếng Anh, 4 đáp án). Quiz cache trong D1 theo `guid` bài (bảng `reading_quizzes`)
nên mỗi bài chỉ tốn 1 call AI. Chọn đáp án có phím tắt 1-4, chấm ngay, giải thích ngắn.

## 2. Shadowing — đọc lại câu bằng mic
Trong khối tra từ (`ClickableSentence`, dùng ở bài đọc / bản dịch / chat) có nút mic:
nghe câu → bấm mic đọc lại → app so transcript (Web Speech API, chạy trong browser,
không tốn AI) với câu gốc, highlight xanh từ đọc đúng / đỏ từ sai-thiếu, chấm % khớp.
Chỉ hiện trên browser hỗ trợ SpeechRecognition (Chrome/Edge/Safari).

## 3. Nghe chép chính tả `/dictation`
Lấy câu từ bài đọc News in Levels (chọn level 1/2/3 = độ khó). App đọc câu bằng TTS
(nghe lại được), bạn gõ lại, chấm diff từng từ: đúng/sai/thiếu. 10 câu/lượt, có điểm,
không tốn AI.

## 4. Badge từ đến hạn ôn trên Home
Ô "Flashcards" ở Home hiện badge đỏ số từ đến hạn ôn hôm nay (SRS đã có sẵn),
kéo người học quay lại ôn đúng lịch. API `/api/flashcards/due-count`.

## 5. Thống kê học tập ở Profile
Heatmap 20 tuần kiểu GitHub từ bảng `activity_days` có sẵn + số liệu tổng:
ngày học, chuỗi hiện tại, XP, số từ đã lưu. API `/api/stats`.

## 6. Nói bằng mic trong Chat
Nút mic cạnh ô nhập chat: nói tiếng Anh → SpeechRecognition chuyển thành chữ đổ vào
input → gửi cho Mochi sửa lỗi như gõ tay. Biến trang chat thành luyện nói.

## 7. Email nhắc học có nội dung thật
Email nhắc streak hằng ngày (cron 13:30 UTC có sẵn) giờ kèm: số từ đến hạn ôn
hôm nay + tin mới nhất trên trang Đọc tin tức, kèm link thẳng vào từng trang.
