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
import { useLanguage } from "../i18n/LanguageProvider";

type Question = { id: number; term: string; choices: string[]; correctMeaning: string };
type Round = { questions: Question[] };
type Difficulty = { key: string; label: string; desc: string; questions: number; secondsPerQuestion: number };

const GAME_KEY = "listening-game";

export default function Listening() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useLanguage();

  const DIFFICULTIES: Difficulty[] = [
    { key: "easy", label: t("game.difficulty.easy"), desc: t("listening.easyDesc"), questions: 10, secondsPerQuestion: 12 },
    { key: "hard", label: t("game.difficulty.hard"), desc: t("listening.hardDesc"), questions: 12, secondsPerQuestion: 9 },
    { key: "legend", label: t("game.difficulty.legend"), desc: t("listening.legendDesc"), questions: 15, secondsPerQuestion: 6 },
  ];

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
    setRound(null);
    submittedRef.current = false;
    setSubmitResult(null);
    setStopped(false);
    api
      .wordGameRound(d.key)
      .then((data) => setRound({ questions: data.questions.slice(0, d.questions) }))
      .catch((err: any) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
        setDifficulty(null);
      });
  }

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
    if (!q || picked || !difficulty) return;
    setTimeLeft(difficulty.secondsPerQuestion);
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
  }, [q, picked, difficulty]);

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
    if (!difficulty) return;
    setIndex(0);
    setScore(0);
    load(difficulty);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title={t("listening.title")}
        subtitle={`${t("listening.subtitle")}${best !== null ? t("game.recordSubtitle", { n: best }) : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}

        {!round && (
          <div className="flex flex-col gap-3">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => {
                  setIndex(0);
                  setScore(0);
                  load(d);
                }}
                disabled={difficulty?.key === d.key}
              >
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

        {q && difficulty && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
              <span>
                {t("game.questionN", { n: index + 1, total: round!.questions.length })}
              </span>
              <span>{t("game.scoreLabel", { n: score })}</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full transition-all", timeLeft <= 2 ? "bg-danger" : "bg-primary")}
                style={{ width: `${(timeLeft / difficulty.secondsPerQuestion) * 100}%` }}
              />
            </div>
            <Card className="mb-4 flex flex-col items-center gap-3 p-6 text-center">
              <button
                type="button"
                onClick={() => speak(q.term)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-hover text-3xl text-white"
                title={t("listening.replay")}
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
                      isCorrect && "border-success bg-success-soft",
                      isPicked && !isCorrect && "border-danger bg-danger-soft",
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
            <div className="mt-1 text-sm text-fg-muted">{stopped ? t("listening.wrongStop") : t("listening.correctSuffix")}</div>
            {submitResult && (
              <div className="mt-2 text-sm font-semibold text-accent">
                {submitResult.isNewBest ? t("game.newRecord") : t("game.record", { n: submitResult.bestScore })}
                {submitResult.xpAwarded > 0 ? ` · +${submitResult.xpAwarded} XP` : ""}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <Button
                block
                variant="outline"
                onClick={() => {
                  setRound(null);
                  setDifficulty(null);
                }}
              >
                {t("game.changeDifficulty")}
              </Button>
              <Button block onClick={restart}>
                {t("game.playAgain")}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
