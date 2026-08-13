import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Spinner } from "../ui/Spinner";
import { LoadingState, ErrorState } from "../ui/states";
import { SendIcon, PlusIcon } from "../components/icons";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";

type Message = { role: "user" | "model"; content: string; created_at?: string };

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  function loadHistory() {
    setError("");
    api
      .chatHistory()
      .then((data) => setMessages(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function clearChat() {
    if (clearing || !window.confirm(t("chat.confirmClear"))) return;
    setClearing(true);
    setError("");
    try {
      await api.clearChat();
      setMessages([]);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(err.message);
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col">
      <header className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h1 className="m-0 text-lg font-bold">AI Chat</h1>
          <p className="m-0 text-xs text-fg-muted">{t("chat.subtitle")}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={clearChat}
          disabled={clearing || !messages || messages.length === 0}
          aria-label={t("chat.newChat")}
        >
          <PlusIcon size={16} />
          {t("chat.newChat")}
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {error && <ErrorState retry={loadHistory}>{error}</ErrorState>}
        {!error && messages === null && <LoadingState />}
        {!error && messages && messages.length === 0 && (
          <div className="py-16 text-center text-sm text-fg-muted">{t("chat.empty")}</div>
        )}
        {!error && messages && (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[85%] rounded-ui px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user" ? "ml-auto bg-primary text-primary-fg" : "bg-surface-muted text-fg"
                )}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="w-fit rounded-ui bg-surface-muted px-4 py-2.5">
                <Spinner size={16} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-border p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={t("chat.placeholder")}
          className="flex-1"
        />
        <Button size="icon" onClick={send} disabled={sending || !input.trim()} aria-label={t("chat.send")}>
          <SendIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
