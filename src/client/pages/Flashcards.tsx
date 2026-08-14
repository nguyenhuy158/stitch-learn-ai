import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Button } from "../ui/Button";
import { LoadingState } from "../ui/states";
import { useToast } from "../ui/Toast";
import { cn } from "../ui/cn";
import { speak } from "../lib/speak";
import { transcribeToIpa } from "../lib/ipa";
import { StarIcon } from "../components/icons";
import { useLanguage } from "../i18n/LanguageProvider";

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
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState("");
  const [grading, setGrading] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const { t } = useLanguage();
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [vocab, saved, me] = await Promise.all([api.vocab(), api.savedVocab(), api.me()]);
        const sessionSize = me.user?.flashcard_session_size || 10;
        setCards(Array.isArray(vocab) ? vocab.slice(0, sessionSize) : []);
        setSavedIds(new Set((Array.isArray(saved) ? saved : []).map((s: any) => s.id)));
        setAudioOn(me.user?.flashcard_audio !== 0);
      } catch (err: any) {
        if (isUnauthorized(err)) return navigate("/login");
        setError(t("flashcards.loadError") + err.message);
      }
    })();
  }, [navigate, t]);

  const current = cards && cards.length ? cards[0] : null;

  useEffect(() => {
    if (current && audioOn) speak(current.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, audioOn]);
  const [ipa, setIpa] = useState<string | null>(null);
  useEffect(() => {
    setIpa(null);
    if (!current) return;
    let cancelled = false;
    transcribeToIpa(current.term).then((result) => {
      if (!cancelled) setIpa(result);
    });
    return () => {
      cancelled = true;
    };
  }, [current?.id]);
  const family = useMemo(() => {
    if (!current?.word_family) return [];
    try {
      return JSON.parse(current.word_family);
    } catch {
      return [];
    }
  }, [current]);

  const TAP_THRESHOLD = 8;
  const SWIPE_THRESHOLD = 90;
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef<number | null>(null);
  const [badgeTop, setBadgeTop] = useState(50);

  useEffect(() => {
    setDragX(0);
    setBadgeTop(20 + Math.random() * 60);
  }, [current?.id]);

  function onDragStart(e: React.PointerEvent) {
    if (grading) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartX.current = e.clientX;
    setDragging(true);
    setBadgeTop(20 + Math.random() * 60);
  }

  function onDragMove(e: React.PointerEvent) {
    if (dragStartX.current === null) return;
    setDragX(e.clientX - dragStartX.current);
  }

  function onDragEnd() {
    if (dragStartX.current === null) return;
    const dx = dragX;
    dragStartX.current = null;
    setDragging(false);
    if (Math.abs(dx) < TAP_THRESHOLD) {
      setDragX(0);
      setFlipped((f) => !f);
      return;
    }
    if (flipped && Math.abs(dx) > SWIPE_THRESHOLD) {
      grade(dx > 0 ? 4 : 2);
      return;
    }
    setDragX(0);
  }

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
      toast.error(t("common.error"));
    }
  }

  async function grade(quality: number) {
    if (!current || grading) return;
    const gradedId = current.id;
    setGrading(true);
    try {
      await api.reviewVocab(gradedId, quality);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      // Best-effort: card still leaves the deck locally even if the write failed.
    } finally {
      setGrading(false);
      setFlipped(false);
      setCards((prev) => (prev ? prev.filter((c) => c.id !== gradedId) : prev));
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader backTo="/" title={t("flashcards.title")} />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && cards === null && <LoadingState />}
        {!error && cards && cards.length === 0 && <PageState>{t("flashcards.empty")}</PageState>}
        {!error && current && (
          <>
            <div className="mb-3 text-center text-xs text-fg-muted">
              {t("flashcards.remaining", { n: cards!.length })} — {current.lesson_title}
            </div>
            {flipped && (
              <>
                <div
                  className="pointer-events-none fixed left-3 z-20 rounded-full bg-danger px-3 py-1 text-xs font-bold text-white"
                  style={{
                    top: `${badgeTop}%`,
                    opacity: Math.min(1, Math.max(0, -dragX / SWIPE_THRESHOLD)),
                    transform: "translateY(-50%)",
                    transition: dragging ? "none" : "top 250ms ease, opacity 250ms ease",
                  }}
                >
                  ✕ {t("flashcards.swipeForgot")}
                </div>
                <div
                  className="pointer-events-none fixed right-3 z-20 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white"
                  style={{
                    top: `${badgeTop}%`,
                    opacity: Math.min(1, Math.max(0, dragX / SWIPE_THRESHOLD)),
                    transform: "translateY(-50%)",
                    transition: dragging ? "none" : "top 250ms ease, opacity 250ms ease",
                  }}
                >
                  ✓ {t("flashcards.swipeRemembered")}
                </div>
              </>
            )}
            <div className="relative mb-4 h-64 sm:h-80" style={{ perspective: "1000px" }}>
              <div
                onPointerDown={onDragStart}
                onPointerMove={onDragMove}
                onPointerUp={onDragEnd}
                onPointerCancel={onDragEnd}
                className="relative h-full w-full touch-pan-y select-none"
                style={{
                  transform: `translateX(${dragX}px) rotate(${dragX / 16}deg)`,
                  transition: dragging ? "none" : "transform 250ms ease",
                }}
              >
                <div
                  className="relative h-full w-full cursor-pointer rounded-3xl transition-transform duration-500"
                  style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : undefined }}
                >
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-surface p-6 text-center shadow-lg"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <div className="mb-3 text-xs uppercase text-fg-muted">{current.lesson_title}</div>
                    <div className="mb-2.5 text-5xl leading-none">{emojiFor(current.term)}</div>
                    <div className="text-2xl font-extrabold text-primary-hover">{current.term}</div>
                    {ipa && <div className="mt-1 text-sm text-fg-muted">/{ipa}/</div>}
                  </div>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-primary-hover p-6 text-center text-white shadow-lg"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <div className="mb-2.5 text-xl font-bold text-accent">{current.meaning}</div>
                    {current.example && <div className="text-sm italic text-white/80">"{current.example}"</div>}
                    {family.length > 0 && (
                      <div className="mt-2.5 text-xs text-white/85">
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
            </div>
            <div className="mb-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => speak(current.term)}
                title={t("audio.speak")}
                aria-label={t("audio.speak")}
                className="flex h-11 w-12 shrink-0 items-center justify-center rounded-ui bg-primary-hover text-xl text-white shadow-sm"
              >
                🔊
              </button>
              <button
                type="button"
                onClick={toggleSave}
                title={t("flashcards.save")}
                className={cn(
                  "flex h-11 w-12 shrink-0 items-center justify-center rounded-ui text-xl shadow-sm",
                  savedIds.has(current.id) ? "bg-accent text-white" : "bg-surface"
                )}
              >
                <StarIcon fill={savedIds.has(current.id) ? "currentColor" : "none"} />
              </button>
            </div>
            {!flipped && (
              <div className="text-center text-xs text-fg-muted">{t("flashcards.tapHint")}</div>
            )}
            {flipped && (
              <div className="flex items-center gap-3">
                <Button variant="outline" block disabled={grading} onClick={() => grade(2)}>
                  {t("flashcards.forgot")}
                </Button>
                <Button variant="outline" block disabled={grading} onClick={() => grade(4)}>
                  {t("flashcards.remembered")}
                </Button>
                <Button block disabled={grading} onClick={() => grade(5)}>
                  {t("flashcards.easy")}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
