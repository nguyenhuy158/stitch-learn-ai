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
type Difficulty = { key: string; label: string; desc: string; roundSize: number; secondsPerWord: number };

const DIFFICULTIES: Difficulty[] = [
  { key: "easy", label: "Dễ", desc: "A1-A2 · 8 từ · 15s/từ", roundSize: 8, secondsPerWord: 15 },
  { key: "hard", label: "Khó", desc: "B1-B2 · 10 từ · 10s/từ", roundSize: 10, secondsPerWord: 10 },
  { key: "legend", label: "Huyền thoại", desc: "Trộn mọi trình độ · 12 từ · 7s/từ", roundSize: 12, secondsPerWord: 7 }
];

const GAME_KEY = "spelling-game";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function Spelling() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [words, setWords] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => {
    api.gameLeaderboard(GAME_KEY).then((res) => setBest(res.myBest)).catch(() => {});
  }, []);

  function load(d: Difficulty) {
    setError("");
    setDifficulty(d);
    setWords(null);
    submittedRef.current = false;
    setSubmitResult(null);
    setStopped(false);
    api
      .wordPool(d.roundSize, d.key)
      .then((data: { words: Word[] }) => {
        setWords(data.words);
        setIndex(0);
        setScore(0);
        setInput("");
        setStatus("idle");
      })
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
        setDifficulty(null);
      });
  }

  useEffect(() => inputRef.current?.focus(), [index]);

  const current = words && index < words.length ? words[index] : null;
  const finished = words && index >= words.length;
  const over = finished || stopped;

  useEffect(() => {
    if (!over || submittedRef.current) return;
    submittedRef.current = true;
    api
      .submitGameScore(GAME_KEY, score * 10, score)
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest, xpAwarded: res.xpAwarded }))
      .catch(() => {});
  }, [over, score]);

  useEffect(() => {
    if (!current || status !== "idle" || stopped || !difficulty) return;
    setTimeLeft(difficulty.secondsPerWord);
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          fail();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, status, stopped, difficulty]);

  function fail() {
    if (status !== "idle" || stopped) return;
    setStatus("wrong");
    playWrongSound();
    setTimeout(() => setStopped(true), 1400);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || status !== "idle") return;
    stopTimer();
    const ok = normalize(input) === normalize(current.term);
    if (ok) {
      setStatus("correct");
      playCorrectSound();
      setScore((s) => s + 1);
      setTimeout(() => {
        setInput("");
        setStatus("idle");
        setIndex((i) => i + 1);
      }, 500);
    } else {
      fail();
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title="Gõ chữ theo nghĩa"
        subtitle={`Đọc nghĩa, gõ đúng từ tiếng Anh trước khi hết giờ — sai là dừng cuộc chơi.${best !== null ? ` Kỷ lục: ${best}` : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}

        {!words && !error && (
          <div className="flex flex-col gap-3">
            {DIFFICULTIES.map((d) => (
              <button key={d.key} type="button" onClick={() => load(d)} disabled={difficulty?.key === d.key}>
                <Card className="p-4 text-left">
                  <div className="text-lg font-bold text-primary-hover">{d.label}</div>
                  <div className="mt-0.5 text-sm text-fg-muted">{d.desc}</div>
                </Card>
              </button>
            ))}
            {difficulty && !words && !error && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
          </div>
        )}

        {current && !over && difficulty && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
              <span>
                Câu {index + 1}/{words!.length}
              </span>
              <span>Điểm: {score}</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full transition-all", timeLeft <= 3 ? "bg-red-500" : "bg-primary")}
                style={{ width: `${(timeLeft / difficulty.secondsPerWord) * 100}%` }}
              />
            </div>
            <Card className="mb-4 p-6 text-center">
              <div className="text-xl font-bold text-primary-hover">{current.meaning}</div>
              <div className="mt-1 text-xs text-fg-muted">{current.term.length} chữ</div>
            </Card>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <input
                ref={inputRef}
                value={status === "idle" ? input : current.term}
                onChange={(e) => setInput(e.target.value)}
                disabled={status !== "idle"}
                autoComplete="off"
                autoCapitalize="off"
                className={cn(
                  "rounded-ui border px-3.5 py-3 text-center text-lg",
                  status === "correct" && "border-green-500 bg-green-500/10",
                  status === "wrong" && "border-red-500 bg-red-500/10",
                  status === "idle" && "border-border bg-surface"
                )}
              />
              <Button type="submit" block disabled={status !== "idle" || !input.trim()}>
                Kiểm tra
              </Button>
            </form>
          </>
        )}

        {over && difficulty && (
          <Card className="p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">
              {score} / {words!.length}
            </div>
            <div className="mt-1 text-sm text-fg-muted">{stopped ? "Sai hoặc hết giờ, dừng cuộc chơi!" : "câu đúng"}</div>
            {submitResult && (
              <div className="mt-2 text-sm font-semibold text-accent">
                {submitResult.isNewBest ? "Kỷ lục mới!" : `Kỷ lục: ${submitResult.bestScore}`}
                {submitResult.xpAwarded > 0 ? ` · +${submitResult.xpAwarded} XP` : ""}
              </div>
            )}
            <div className="mt-4 flex gap-2.5">
              <Button
                block
                variant="outline"
                onClick={() => {
                  setWords(null);
                  setDifficulty(null);
                }}
              >
                Đổi độ khó
              </Button>
              <Button block onClick={() => load(difficulty)}>
                Chơi lại
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
