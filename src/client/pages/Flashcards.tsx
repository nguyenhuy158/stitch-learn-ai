import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";

type Card = { id: number; term: string; meaning: string; example?: string; word_family?: string; lesson_title: string };

const EMOJI_POOL = ["📘", "✨", "🌱", "🔑", "🎯", "💡", "🧩", "🚀", "🌟", "🍀", "🎈", "🧭", "🌈", "🔥", "🌻", "🎵", "🧠", "🌊", "⭐", "🍃"];
function emojiFor(term: string) {
  let hash = 0;
  for (let i = 0; i < term.length; i++) hash = (hash * 31 + term.charCodeAt(i)) >>> 0;
  return EMOJI_POOL[hash % EMOJI_POOL.length];
}

export default function Flashcards() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [vocab, saved] = await Promise.all([api.vocab(), api.savedVocab()]);
        setCards(Array.isArray(vocab) ? vocab : []);
        setSavedIds(new Set((Array.isArray(saved) ? saved : []).map((s: any) => s.id)));
      } catch (err: any) {
        if (isUnauthorized(err)) return navigate("/login");
        setError("Không tải được flashcards: " + err.message);
      }
    })();
  }, [navigate]);

  const current = cards && cards.length ? cards[index] : null;
  const family = useMemo(() => {
    if (!current?.word_family) return [];
    try {
      return JSON.parse(current.word_family);
    } catch {
      return [];
    }
  }, [current]);

  async function toggleSave() {
    if (!current) return;
    const nowSaved = !savedIds.has(current.id);
    try {
      await api.saveVocab(current.id, nowSaved);
      setSavedIds((prev) => {
        const next = new Set(prev);
        nowSaved ? next.add(current.id) : next.delete(current.id);
        return next;
      });
    } catch {
      /* best-effort, matches old inline catch{} */
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader backTo="/" title="Thẻ ghi nhớ" />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && cards === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && cards && cards.length === 0 && <PageState>Chưa có flashcard nào. Vào một bài học để tạo từ vựng trước.</PageState>}
        {!error && current && (
          <>
            <div className="mb-3 text-center text-[13px] text-fg-muted">
              {index + 1} / {cards!.length} — {current.lesson_title}
            </div>
            <div className="mb-4 h-64 sm:h-80" style={{ perspective: "1000px" }}>
              <div
                onClick={() => setFlipped((f) => !f)}
                className="relative h-full w-full cursor-pointer rounded-3xl transition-transform duration-500"
                style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : undefined }}
              >
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-6 text-center shadow-lg"
                  style={{ backfaceVisibility: "hidden", background: "var(--card)" }}
                >
                  <div className="mb-3 text-xs uppercase text-fg-muted">{current.lesson_title}</div>
                  <div className="mb-2.5 text-5xl leading-none">{emojiFor(current.term)}</div>
                  <div className="text-2xl font-extrabold" style={{ color: "var(--teal-dark)" }}>
                    {current.term}
                  </div>
                </div>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl p-6 text-center text-white shadow-lg"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)", background: "var(--teal-dark)" }}
                >
                  <div className="mb-2.5 text-xl font-bold text-accent">{current.meaning}</div>
                  {current.example && <div className="text-sm italic text-white/80">"{current.example}"</div>}
                  {family.length > 0 && (
                    <div className="mt-2.5 text-[13px] text-white/85">
                      {family.map((f: string) => (
                        <span key={f} className="mx-0.5 my-0.5 inline-block rounded-md bg-white/15 px-2 py-0.5">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-5 text-center text-xs text-fg-muted">Chạm vào thẻ để lật</div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                block
                disabled={index === 0}
                onClick={() => {
                  setIndex((i) => i - 1);
                  setFlipped(false);
                }}
              >
                ← Trước
              </Button>
              <button
                type="button"
                onClick={toggleSave}
                title="Lưu từ này"
                className={cn(
                  "flex h-11 w-12 shrink-0 items-center justify-center rounded-ui text-xl shadow-sm",
                  savedIds.has(current.id) ? "bg-accent text-white" : "bg-surface"
                )}
              >
                {savedIds.has(current.id) ? "★" : "☆"}
              </button>
              <Button
                variant="outline"
                block
                disabled={index === cards!.length - 1}
                onClick={() => {
                  setIndex((i) => i + 1);
                  setFlipped(false);
                }}
              >
                Tiếp →
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
