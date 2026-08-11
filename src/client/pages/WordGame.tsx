import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";

type Question = { id: number; term: string; choices: string[]; correctMeaning: string };
type Round = { difficulty: string; secondsPerWord: number; questions: Question[] };
type Difficulty = { key: string; label: string; desc: string };

const DIFFICULTIES: Difficulty[] = [
  { key: "easy", label: "Dễ", desc: "A1-A2 · 10 từ · 10s/từ" },
  { key: "hard", label: "Khó", desc: "B1-B2 · 15 từ · 7s/từ" },
  { key: "legend", label: "Huyền thoại", desc: "Trộn mọi trình độ · 20 từ · 5s/từ" }
];

/** Descending "tè tè tèo tèo" buzzer for a wrong answer, synthesized so no audio asset is needed. */
function playWrongSound() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioCtx();
  const notes = [392, 349, 330, 294];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    const start = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0.15, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.15);
  });
  setTimeout(() => ctx.close(), notes.length * 150 + 200);
}

export default function WordGame() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function start(key: string) {
    setError("");
    setDifficulty(key);
    try {
      const data = await api.wordGameRound(key);
      setRound(data);
      setIndex(0);
      setScore(0);
      setPicked(null);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(err.message);
      setDifficulty(null);
    }
  }

  useEffect(() => {
    if (!round || picked) return;
    setTimeLeft(round.secondsPerWord);
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
  }, [round, index]);

  function answer(choice: string | null) {
    if (!round || picked) return;
    stopTimer();
    const q = round.questions[index];
    setPicked(choice ?? "");
    if (choice === q.correctMeaning) {
      setScore((s) => s + 1);
    } else {
      playWrongSound();
    }
    setTimeout(() => {
      setPicked(null);
      if (index + 1 < round.questions.length) {
        setIndex((i) => i + 1);
      } else {
        setIndex(round.questions.length);
      }
    }, 900);
  }

  const finished = round && index >= round.questions.length;
  const q = round && !finished ? round.questions[index] : null;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader backTo="/" title="Đoán nghĩa từ" subtitle="Chọn nghĩa đúng trước khi hết giờ." />
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

        {finished && (
          <Card className="p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">
              {score} / {round!.questions.length}
            </div>
            <div className="mt-1 text-sm text-fg-muted">câu đúng</div>
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
