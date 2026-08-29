import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Menu } from "../ui/Menu";
import { Spinner } from "../ui/Spinner";
import { LoadingState, ErrorState } from "../ui/states";
import { CheckIcon, HistoryIcon, MicIcon, PlusIcon, SendIcon } from "../components/icons";
import { listenOnce, speechInputSupported } from "../lib/speechInput";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";
import { ClickableSentence } from "../components/ClickableSentence";

type Message = {
  role: "user" | "model";
  content: string;
  created_at?: string;
  /** Chuoi JSON Mochi cham cau vua roi, D1 tra ve nguyen si. */
  metadata?: string | null;
  feedback?: string;
  corrections?: string[];
};

/** Loi sua nam trong cot metadata voi tin nhan cu, nam thang voi tin nhan vua gui. */
function coaching(m: Message): { feedback?: string; corrections: string[] } {
  if (m.corrections || m.feedback) return { feedback: m.feedback, corrections: m.corrections ?? [] };
  try {
    const meta = m.metadata ? JSON.parse(m.metadata) : null;
    return { feedback: meta?.feedback, corrections: Array.isArray(meta?.corrections) ? meta.corrections : [] };
  } catch {
    return { corrections: [] };
  }
}
type Conversation = { id: string; title: string | null; last_at: string; message_count: number };

/** Cuoc tro chuyen dang mo duoc nho lai de F5 khong nhay ve cuoc khac. */
const STORAGE_KEY = "mochi.conversation";
const newConversationId = () => crypto.randomUUID();

export default function Chat() {
  const navigate = useNavigate();
  const [conversationId, setConversationId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || newConversationId()
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const micStopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => micStopRef.current?.(), []);

  function micToggle() {
    if (listening) return micStopRef.current?.();
    setListening(true);
    micStopRef.current = listenOnce(
      (transcript) => setInput((v) => (v ? `${v} ${transcript}` : transcript)),
      () => setListening(false)
    );
  }
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  const loadHistory = useCallback(() => {
    setError("");
    setMessages(null);
    api
      .chatHistory(conversationId)
      .then((data: Message[]) => setMessages(Array.isArray(data) ? data : []))
      .catch((err: any) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [conversationId, navigate]);

  const loadConversations = useCallback(() => {
    api.chatConversations().then(setConversations).catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, conversationId);
    loadHistory();
  }, [conversationId, loadHistory]);

  useEffect(loadConversations, [loadConversations]);

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
      const reply = await api.sendChat(text, conversationId);
      setMessages((prev) => [
        ...(prev || []),
        {
          role: "model",
          content: reply.message ?? "",
          feedback: reply.feedback,
          corrections: Array.isArray(reply.corrections) ? reply.corrections : []
        }
      ]);
      loadConversations();
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  /** Cuoc tro chuyen cu van nam nguyen trong D1, chi mo mot id moi. */
  function startNewChat() {
    setConversationId(newConversationId());
  }

  return (
    <div className="mx-auto flex h-dvh max-w-3xl flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h1 className="m-0 text-lg font-bold">Mochi</h1>
          <p className="m-0 truncate text-xs text-fg-muted">{t("chat.subtitle")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Menu
            align="right"
            items={
              conversations.length
                ? conversations.map((c) => ({
                    label: c.title?.slice(0, 40) || t("chat.untitled"),
                    icon: <CheckIcon size={16} className={c.id === conversationId ? "" : "invisible"} />,
                    onSelect: () => setConversationId(c.id)
                  }))
                : [{ label: t("chat.noConversations"), onSelect: () => {}, disabled: true }]
            }
            trigger={(props) => (
              <Button {...props} variant="outline" size="sm" aria-label={t("chat.conversations")}>
                <HistoryIcon size={16} />
              </Button>
            )}
          />
          <Button variant="outline" size="sm" onClick={startNewChat} aria-label={t("chat.newChat")}>
            <PlusIcon size={16} />
            {t("chat.newChat")}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-5">
        {error && <ErrorState retry={loadHistory}>{error}</ErrorState>}
        {!error && messages === null && <LoadingState />}
        {!error && messages && messages.length === 0 && (
          <div className="py-16 text-center text-sm text-fg-muted">{t("chat.empty")}</div>
        )}
        {!error && messages && (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => {
              const coach = m.role === "model" ? coaching(m) : null;
              return (
                <div key={i} className={cn("flex max-w-[85%] flex-col gap-1.5", m.role === "user" && "ml-auto")}>
                  <div
                    className={cn(
                      "rounded-ui px-4 py-2.5 text-sm leading-relaxed",
                      m.role === "user" ? "bg-primary text-primary-fg" : "bg-surface-muted text-fg"
                    )}
                  >
                    {m.role === "model" ? <ClickableSentence text={m.content} bare /> : m.content}
                  </div>
                  {coach && (coach.corrections.length > 0 || coach.feedback) && (
                    <div className="rounded-ui border-l-3 border-accent bg-warning-soft px-3 py-2 text-xs">
                      {coach.corrections.length > 0 && (
                        <>
                          <div className="font-bold uppercase text-primary-hover">{t("chat.corrections")}</div>
                          <ul className="m-0 mt-1 flex list-none flex-col gap-1 p-0">
                            {coach.corrections.map((c, j) => {
                              const [wrong, right] = c.split(/\s*->\s*/);
                              return (
                                <li key={j} className="flex flex-wrap items-baseline gap-1.5">
                                  <span className="text-danger line-through">{wrong}</span>
                                  {right && <span className="font-bold text-primary">{right}</span>}
                                </li>
                              );
                            })}
                          </ul>
                        </>
                      )}
                      {coach.feedback && <div className={cn("text-fg-muted", coach.corrections.length > 0 && "mt-1.5")}>{coach.feedback}</div>}
                    </div>
                  )}
                </div>
              );
            })}
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
        {speechInputSupported() && (
          <Button
            size="icon"
            variant={listening ? "danger" : "outline"}
            onClick={micToggle}
            aria-label={t("chat.mic")}
            className={listening ? "animate-pulse" : undefined}
          >
            <MicIcon size={18} />
          </Button>
        )}
        <Button size="icon" onClick={send} disabled={sending || !input.trim()} aria-label={t("chat.send")}>
          <SendIcon size={18} />
        </Button>
      </div>
    </div>
  );
}
