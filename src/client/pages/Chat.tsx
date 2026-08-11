import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { SendIcon } from "../components/icons";
import { cn } from "../ui/cn";

type Message = { role: "user" | "model"; content: string; created_at?: string };

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .chatHistory()
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((prev) => [...(prev || []), { role: "user", content: text }]);
    setSending(true);
    try {
      const reply = await api.sendChat(text);
      setMessages((prev) => [...(prev || []), { role: "model", content: reply.message ?? "" }]);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col">
      <header className="border-b border-border px-5 py-4">
        <h1 className="m-0 text-lg font-bold">AI Chat</h1>
        <p className="m-0 text-xs text-fg-muted">Luyện nói tiếng Anh với Gemini, có sửa lỗi kèm giải thích.</p>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {error && <div className="text-center text-sm text-danger">{error}</div>}
        {!error && messages === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && messages && messages.length === 0 && (
          <div className="py-16 text-center text-sm text-fg-muted">Chưa có hội thoại nào. Gõ gì đó bằng tiếng Anh để bắt đầu!</div>
        )}
        {!error && messages && (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "ml-auto bg-primary text-primary-fg" : "bg-surface-muted text-fg"
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="w-fit rounded-2xl bg-surface-muted px-4 py-2.5">
                <Spinner size={16} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Nhập tiếng Anh..."
          className="min-h-11 flex-1 rounded-ui border border-border bg-surface px-3.5 text-base text-fg focus:outline-2 focus:outline-primary"
        />
        <Button size="icon" onClick={send} disabled={sending || !input.trim()} aria-label="Gửi">
          <SendIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
