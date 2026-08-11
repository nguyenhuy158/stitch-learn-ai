import { useState } from "react";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

const FAQ = [
  {
    q: "Chuỗi ngày (streak) tính thế nào?",
    a: "Mỗi ngày bạn hoạt động trên app (mở lại sau khi đăng nhập), chuỗi ngày tăng thêm 1 nếu hôm qua bạn cũng hoạt động, hoặc reset về 1 nếu bị bỏ ngày.",
  },
  {
    q: "AI Chat hoạt động ra sao?",
    a: "Bạn nhắn bằng tiếng Anh, Gemini trả lời tự nhiên và kèm nhận xét/sửa lỗi ngữ pháp nếu có. Lịch sử hội thoại được lưu lại, xem ở trang Lịch sử.",
  },
  {
    q: "Đăng nhập bằng gì?",
    a: "App dùng chung hệ thống đăng nhập Google (SSO) của huyab.click — không cần đặt mật khẩu riêng.",
  },
  {
    q: '"Sửa lỗi viết" khác gì AI Chat?',
    a: 'AI Chat là hội thoại qua lại. "Sửa lỗi viết" nhận 1 đoạn văn dài, trả về bản đã sửa + giải thích từng lỗi cụ thể.',
  },
];

export default function Help() {
  const [message, setMessage] = useState("");
  const [state, setState] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmed = message.trim();
    if (!trimmed) {
      setState({ tone: "error", text: "Vui lòng nhập nội dung." });
      return;
    }
    setSubmitting(true);
    setState({ tone: "info", text: "Đang gửi..." });
    try {
      await api.sendFeedback(trimmed);
      setState({ tone: "ok", text: "Đã gửi, cảm ơn bạn!" });
      setMessage("");
    } catch (err: any) {
      setState({ tone: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backTo="/profile" backLabel="Về Hồ sơ" title="Trợ giúp & Phản hồi" />
      <main className="p-5 sm:p-9">
        <div className="mb-3 mt-1 text-sm font-bold" style={{ color: "var(--teal-dark)" }}>
          Câu hỏi thường gặp
        </div>
        <div className="flex flex-col gap-2.5">
          {FAQ.map((item) => (
            <Card key={item.q} className="p-3.5">
              <div className="mb-1 text-sm font-bold">{item.q}</div>
              <div className="text-[13px] leading-relaxed text-fg-muted">{item.a}</div>
            </Card>
          ))}
        </div>

        <div className="mb-3 mt-6 text-sm font-bold" style={{ color: "var(--teal-dark)" }}>
          Gửi phản hồi
        </div>
        <textarea
          value={message}
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Góp ý, báo lỗi, hoặc câu hỏi khác..."
          className="min-h-[100px] w-full resize-y rounded-ui border border-border bg-surface p-3.5 text-base text-fg focus:outline-2 focus:outline-primary"
        />
        <Button block className="mt-3" onClick={submit} loading={submitting} disabled={submitting}>
          Gửi phản hồi
        </Button>
        {state && (
          <div
            className={
              "mt-2.5 text-center text-[13px] " +
              (state.tone === "ok" ? "text-primary" : state.tone === "error" ? "text-danger" : "text-fg-muted")
            }
          >
            {state.text}
          </div>
        )}
      </main>
    </div>
  );
}
