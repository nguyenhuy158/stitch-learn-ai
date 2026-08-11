import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";
import { playWrongSound, playCorrectSound } from "../lib/gameSounds";
import { speak } from "../lib/speak";

type Question = { id: number; term: string; choices: string[]; correctMeaning: string };
type Round = { questions: Question[] };

const GAME_KEY = "listening-game";
const SECONDS_PER_QUESTION = 10;

export default function Listening() {
  const navigate = useNavigate();
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  useEffect(() => {
    api.gameLeaderboard(GAME_KEY).then((res) => setBest(res.myBest)).catch(() => {});
  }, []);

  useEffect(() => {
    api
      .wordGameRound("legend")
      .then((data) => setRound({ questions: data.questions.slice(0, 12) }))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [navigate]);

  const finished = round && index >= round.questions.length;
  const over = finished || stopped;
  const q = round && !over ? round.questions[index] : null;

  useEffect(() => {
    if (!over || submittedRef.current) return;
    submittedRef.current = true;
    api
      .submitGameScore(GAME_KEY, score, score)
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest, xpAwarded: res.xpAwarded }))
      .catch(() => {});
  }, [over, score]);

  useEffect(() => {
    if (q) speak(q.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id]);

  useEffect(() => {
    if (!q || picked) return;
    setTimeLeft(SECONDS_PER_QUESTION);
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
  }, [q, picked]);

  function answer(choice: string | null) {
    if (!round || picked || stopped) return;
    stopTimer();
    setPicked(choice ?? "");
    if (choice === q!.correctMeaning) {
      playCorrectSound();
      setScore((s) => s + 1);
      setTimeout(() => {
        setPicked(null);
        setIndex((i) => i + 1);
      }, 600);
    } else {
      playWrongSound();
      setTimeout(() => setStopped(true), 900);
    }
  }

  function restart() {
    setRound(null);
    setIndex(0);
    setScore(0);
    setStopped(false);
    setSubmitResult(null);
    submittedRef.current = false;
    api
      .wordGameRound("legend")
      .then((data) => setRound({ questions: data.questions.slice(0, 12) }))
      .catch((err) => setError(err.message));
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title="Nghe đoán từ"
        subtitle={`Nghe phát âm rồi chọn nghĩa đúng — sai là dừng cuộc chơi.${best !== null ? ` Kỷ lục: ${best}` : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && round === null && (
          <div className="flex justify-center py-16">
            <Spinner />
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
                style={{ width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%` }}
              />
            </div>
            <Card className="mb-4 flex flex-col items-center gap-3 p-6 text-center">
              <button
                type="button"
                onClick={() => speak(q.term)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-hover text-3xl text-white"
                title="Nghe lại"
              >
                🔊
              </button>
              {picked !== null && <div className="text-lg font-bold text-primary-hover">{q.term}</div>}
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
            <div className="text-2xl font-extrabold text-primary-hover">
              {score} / {round!.questions.length}
            </div>
            <div className="mt-1 text-sm text-fg-muted">{stopped ? "Sai rồi, dừng cuộc chơi!" : "câu đúng"}</div>
            {submitResult && (
              <div className="mt-2 text-sm font-semibold text-accent">
                {submitResult.isNewBest ? "Kỷ lục mới!" : `Kỷ lục: ${submitResult.bestScore}`}
                {submitResult.xpAwarded > 0 ? ` · +${submitResult.xpAwarded} XP` : ""}
              </div>
            )}
            <Button block className="mt-4" onClick={restart}>
              Chơi lại
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
