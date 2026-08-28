-- Nhieu cuoc tro chuyen thay vi mot dong chat duy nhat: "Cuoc tro chuyen moi"
-- truoc day xoa sach lich su, gio chi mo mot conversation_id moi.
--
-- Khong tao bang conversations rieng: tieu de va thoi gian deu suy ra duoc tu
-- chinh chat_messages (GROUP BY), them bang nua chi de dong bo tay.
ALTER TABLE chat_messages ADD COLUMN conversation_id TEXT;

-- Tin nhan cu gom vao mot cuoc tro chuyen de nguoi dung khong mat lich su.
UPDATE chat_messages SET conversation_id = 'legacy' WHERE conversation_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation
  ON chat_messages (user_id, conversation_id, created_at);
