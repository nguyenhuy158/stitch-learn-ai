import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";
import { playWrongSound, playCorrectSound } from "../lib/gameSounds";

type Word = { id: number; term: string; meaning: string };

const START_MS = 6000;
const MIN_MS = 2200;
const STEP_MS = 250;
const START_LIVES = 1;
const GAME_KEY = "word-race";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function WordRace() {
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [progress, setProgress] = useState(0);
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const durationRef = useRef(START_MS);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    api.gameLeaderboard(GAME_KEY).then((res) => setBest(res.myBest)).catch(() => {});
  }, []);

  function load() {
    submittedRef.current = false;
    setSubmitResult(null);
    api
      .wordPool(20)
      .then((data: { words: Word[] }) => {
        setWords(data.words);
        setIndex(0);
        setLives(START_LIVES);
        setScore(0);
        durationRef.current = START_MS;
      })
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }

  useEffect(load, [navigate]);

  const current = words && index < words.length && lives > 0 ? words[index] : null;
  const gameOver = words && (lives <= 0 || index >= words.length);

  useEffect(() => {
    if (!gameOver || submittedRef.current) return;
    submittedRef.current = true;
    api
      .submitGameScore(GAME_KEY, score * 10, score)
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest, xpAwarded: res.xpAwarded }))
      .catch(() => {});
  }, [gameOver, score]);

  function stopLoop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }

  function next(miss: boolean) {
    stopLoop();
    if (miss) {
      setLives((l) => l - 1);
      setFeedback("wrong");
      playWrongSound();
    }
    setTimeout(() => {
      setFeedback(null);
      setInput("");
      setProgress(0);
      setIndex((i) => i + 1);
      durationRef.current = Math.max(MIN_MS, durationRef.current - STEP_MS);
    }, miss ? 500 : 200);
  }

  useEffect(() => {
    if (!current) return;
    setProgress(0);
    startRef.current = performance.now();
    const duration = durationRef.current;
    function tick(now: number) {
      const elapsed = now - startRef.current;
      const pct = Math.min(1, elapsed / duration);
      setProgress(pct);
      if (pct >= 1) {
        next(true);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
    inputRef.current?.focus();
    return stopLoop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || feedback) return;
    if (normalize(input) === normalize(current.meaning)) {
      playCorrectSound();
      setFeedback("correct");
      setScore((s) => s + 1);
      next(false);
    } else {
      setInput("");
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title="Từ rơi"
        subtitle={`Gõ nghĩa trước khi từ chạm đáy — tốc độ tăng dần.${best !== null ? ` Kỷ lục: ${best}` : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && words === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {current && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
              <span>{"❤️".repeat(lives)}</span>
              <span>Điểm: {score}</span>
            </div>
            <div className="relative mb-4 h-56 overflow-hidden rounded-3xl bg-surface shadow-lg">
              <div
                className="absolute left-1/2 -translate-x-1/2 text-2xl font-extrabold text-primary-hover transition-none"
                style={{ top: `${8 + progress * 78}%` }}
              >
                {current.term}
              </div>
              <div className="absolute bottom-0 h-1.5 w-full bg-red-500/30" />
            </div>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!!feedback}
                autoComplete="off"
                placeholder="Nhập nghĩa tiếng Việt..."
                className={cn(
                  "rounded-ui border px-3.5 py-3 text-center text-lg",
                  feedback === "correct" && "border-green-500 bg-green-500/10",
                  feedback === "wrong" && "border-red-500 bg-red-500/10",
                  !feedback && "border-border bg-surface"
                )}
              />
              {feedback === "wrong" && (
                <div className="text-center text-sm text-fg-muted">Đáp án: {current.meaning}</div>
              )}
            </form>
          </>
        )}

        {gameOver && (
          <Card className="p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">{score} điểm</div>
            <div className="mt-1 text-sm text-fg-muted">{lives <= 0 ? "Hết mạng!" : "Hoàn thành!"}</div>
            {submitResult && (
              <div className="mt-2 text-sm font-semibold text-accent">
                {submitResult.isNewBest ? "Kỷ lục mới!" : `Kỷ lục: ${submitResult.bestScore}`}
                {submitResult.xpAwarded > 0 ? ` · +${submitResult.xpAwarded} XP` : ""}
              </div>
            )}
            <Button block className="mt-4" onClick={load}>
              Chơi lại
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
