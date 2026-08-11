import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";

type Message = { role: string; content: string; created_at: string; metadata?: string };
type Pair = { user: Message; reply: Message | null };

function dayLabel(dateStr: string) {
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr.replace(" ", "T") + "Z");
  return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function pairMessages(messages: Message[]): Pair[] {
  const pairs: Pair[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === "user") {
      const reply = messages[i + 1] && messages[i + 1].role === "model" ? messages[i + 1] : null;
      pairs.push({ user: messages[i], reply });
      if (reply) i++;
    }
  }
  return pairs;
}

function groupByDay(pairs: Pair[]) {
  const groups = new Map<string, Pair[]>();
  for (const pair of pairs) {
    const key = dayLabel(pair.user.created_at);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(pair);
  }
  return groups;
}

function Entry({ pair }: { pair: Pair }) {
  let metadata: any = null;
  try {
    metadata = pair.reply?.metadata ? JSON.parse(pair.reply.metadata) : null;
  } catch {
    metadata = null;
  }
  const correctionCount = metadata && Array.isArray(metadata.corrections) ? metadata.corrections.length : 0;

  return (
    <div className="mb-2 flex items-start gap-3 rounded-2xl bg-surface p-3.5 shadow-sm">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary-soft text-lg text-primary">
        💬
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">Luyện nói AI</div>
        <div className="mt-0.5 overflow-hidden truncate text-[13px] text-fg-muted">{pair.user.content}</div>
        <div className="mt-1 text-xs text-fg-muted">{formatTime(pair.user.created_at)}</div>
      </div>
      {pair.reply && (
        <span
          className={cn(
            "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
            correctionCount === 0 ? "bg-success-soft text-success" : "bg-warning-soft text-accent"
          )}
        >
          {correctionCount === 0 ? "Không lỗi" : `${correctionCount} lỗi`}
        </span>
      )}
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [pairs, setPairs] = useState<Pair[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [me, history] = await Promise.all([api.me(), api.chatHistory()]);
        if (!me.user) return navigate("/login");
        setUser(me.user);
        setPairs(pairMessages(Array.isArray(history) ? history : []));
      } catch (err: any) {
        setError("Không tải được lịch sử: " + err.message);
      }
    })();
  }, [navigate]);

  const groups = pairs ? groupByDay(pairs) : null;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backTo="/" title="Lịch sử học tập" />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && !pairs && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && user && pairs && (
          <>
            <div className="mb-5 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl bg-surface p-3.5 text-center shadow-sm">
                <div className="text-xl font-extrabold text-primary-hover">
                  {user.streak || 0}
                </div>
                <div className="mt-0.5 text-[11px] uppercase text-fg-muted">Chuỗi ngày</div>
              </div>
              <div className="rounded-2xl bg-surface p-3.5 text-center shadow-sm">
                <div className="text-xl font-extrabold text-primary-hover">
                  {user.xp || 0}
                </div>
                <div className="mt-0.5 text-[11px] uppercase text-fg-muted">Điểm XP</div>
              </div>
              <div className="rounded-2xl bg-surface p-3.5 text-center shadow-sm">
                <div className="text-xl font-extrabold text-primary-hover">
                  {pairs.length}
                </div>
                <div className="mt-0.5 text-[11px] uppercase text-fg-muted">Lượt hội thoại</div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl bg-primary-hover p-4 text-white">
              <div className="flex justify-between text-[13px] text-white/70">
                <span>Trình độ hiện tại</span>
                <span>{user.level_progress || 0}%</span>
              </div>
              <div className="my-0.5 mb-2.5 text-lg font-bold">{user.level || "B1"}</div>
              <div className="h-2 overflow-hidden rounded-md bg-white/20">
                <div className="h-full bg-white" style={{ width: `${user.level_progress || 0}%` }} />
              </div>
            </div>

            {groups && groups.size === 0 && <PageState>Chưa có hoạt động nào. Vào AI Chat để bắt đầu!</PageState>}

            {groups &&
              [...groups.entries()]
                .reverse()
                .map(([day, dayPairs]) => (
                  <div key={day} className="mb-5">
                    <div className="mb-2 text-[13px] font-bold text-primary-hover">
                      {day}
                    </div>
                    {[...dayPairs].reverse().map((p, i) => (
                      <Entry key={i} pair={p} />
                    ))}
                  </div>
                ))}
          </>
        )}
      </main>
    </div>
  );
}
