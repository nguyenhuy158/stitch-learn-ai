import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";
import { playWrongSound, playCorrectSound } from "../lib/gameSounds";

type Question = { id: number; term: string; choices: string[]; correctMeaning: string };
type Round = { difficulty: string; secondsPerWord: number; questions: Question[] };
type Difficulty = { key: string; label: string; desc: string };

const DIFFICULTIES: Difficulty[] = [
  { key: "easy", label: "Dễ", desc: "A1-A2 · 10 từ · 10s/từ" },
  { key: "hard", label: "Khó", desc: "B1-B2 · 15 từ · 7s/từ" },
  { key: "legend", label: "Huyền thoại", desc: "Trộn mọi trình độ · 20 từ · 5s/từ" }
];

const GAME_KEY = "word-game";

/** Faster = more points: full marks for an instant answer, tapering to a small floor near the timeout. */
function scoreFor(remainingMs: number, totalMs: number) {
  return Math.max(10, Math.round(200 * (remainingMs / totalMs)));
}

export default function WordGame() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartRef = useRef(0);
  const submittedRef = useRef(false);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => {
    api.gameLeaderboard(GAME_KEY).then((res) => setBest(res.myBest)).catch(() => {});
  }, []);

  async function start(key: string) {
    setError("");
    setDifficulty(key);
    try {
      const data = await api.wordGameRound(key);
      setRound(data);
      setIndex(0);
      setScore(0);
      setCorrectCount(0);
      setPicked(null);
      setStopped(false);
      setSubmitResult(null);
      submittedRef.current = false;
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(err.message);
      setDifficulty(null);
    }
  }

  useEffect(() => {
    if (!round || picked || stopped) return;
    setTimeLeft(round.secondsPerWord);
    questionStartRef.current = performance.now();
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          answer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, index, stopped]);

  function answer(choice: string | null) {
    if (!round || picked || stopped) return;
    stopTimer();
    const q = round.questions[index];
    setPicked(choice ?? "");
    const totalMs = round.secondsPerWord * 1000;
    const remainingMs = Math.max(0, totalMs - (performance.now() - questionStartRef.current));
    if (choice === q.correctMeaning) {
      playCorrectSound();
      setScore((s) => s + scoreFor(remainingMs, totalMs));
      setCorrectCount((c) => c + 1);
      setTimeout(() => {
        setPicked(null);
        setIndex((i) => i + 1);
      }, 500);
    } else {
      playWrongSound();
      setTimeout(() => setStopped(true), 900);
    }
  }

  const finished = round && index >= round.questions.length;
  const over = finished || stopped;
  const q = round && !over ? round.questions[index] : null;

  useEffect(() => {
    if (!over || !round || submittedRef.current) return;
    submittedRef.current = true;
    api
      .submitGameScore(GAME_KEY, score, correctCount)
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest, xpAwarded: res.xpAwarded }))
      .catch(() => {});
  }, [over, round, score, correctCount]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title="Đoán nghĩa từ"
        subtitle={`Càng nhanh càng nhiều điểm — sai là dừng cuộc chơi.${best !== null ? ` Kỷ lục: ${best}` : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}

        {!round && (
          <div className="flex flex-col gap-3">
            {DIFFICULTIES.map((d) => (
              <button key={d.key} type="button" onClick={() => start(d.key)} disabled={difficulty === d.key}>
                <Card className="p-4 text-left">
                  <div className="text-lg font-bold text-primary-hover">{d.label}</div>
                  <div className="mt-0.5 text-sm text-fg-muted">{d.desc}</div>
                </Card>
              </button>
            ))}
            {difficulty && !round && !error && (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            )}
          </div>
        )}

        {q && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
              <span>
                Câu {index + 1}/{round!.questions.length}
              </span>
              <span>Điểm: {score}</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full transition-all", timeLeft <= 2 ? "bg-red-500" : "bg-primary")}
                style={{ width: `${(timeLeft / round!.secondsPerWord) * 100}%` }}
              />
            </div>
            <Card className="mb-4 p-6 text-center">
              <div className="text-3xl font-extrabold text-primary-hover">{q.term}</div>
            </Card>
            <div className="flex flex-col gap-2">
              {q.choices.map((choice) => {
                const isPicked = picked !== null && choice === picked;
                const isCorrect = picked !== null && choice === q.correctMeaning;
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={picked !== null}
                    onClick={() => answer(choice)}
                    className={cn(
                      "rounded-ui border px-3.5 py-3 text-left text-sm",
                      isCorrect && "border-green-500 bg-green-500/10",
                      isPicked && !isCorrect && "border-red-500 bg-red-500/10",
                      !isPicked && !isCorrect && "border-border bg-surface"
                    )}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {over && (
          <Card className="p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">{score} điểm</div>
            <div className="mt-1 text-sm text-fg-muted">
              {stopped ? "Sai rồi, dừng cuộc chơi!" : "Hoàn thành cả bài!"}
            </div>
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
                  setRound(null);
                  setDifficulty(null);
                }}
              >
                Đổi độ khó
              </Button>
              <Button block onClick={() => start(round!.difficulty)}>
                Chơi lại
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
