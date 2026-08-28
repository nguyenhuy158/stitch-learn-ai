import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../ui/cn";
import { playWrongSound, playCorrectSound } from "../lib/gameSounds";
import { speak } from "../lib/speak";
import { useLanguage } from "../i18n/LanguageProvider";
import { DifficultyPicker } from "../components/DifficultyPicker";

type Word = { id: number; term: string; meaning: string };
type Difficulty = { key: string; label: string; desc: string; roundSize: number; secondsPerWord: number };
type Letter = { key: string; char: string };

const GAME_KEY = "scramble-game";

/** Shuffle until the order actually differs, so a short word isn't handed over unscrambled. */
function scramble(term: string): Letter[] {
  const chars = [...term];
  let out = chars;
  for (let attempt = 0; attempt < 10 && out.join("") === term; attempt++) {
    out = [...chars];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  }
  return out.map((char, i) => ({ key: `${i}-${char}`, char }));
}

export default function Scramble() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [words, setWords] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [pool, setPool] = useState<Letter[]>([]);
  const [picked, setPicked] = useState<Letter[]>([]);
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useLanguage();

  const DIFFICULTIES: Difficulty[] = [
    { key: "easy", label: t("game.difficulty.easy"), desc: t("scramble.easyDesc"), roundSize: 8, secondsPerWord: 25 },
    { key: "hard", label: t("game.difficulty.hard"), desc: t("scramble.hardDesc"), roundSize: 10, secondsPerWord: 18 },
    { key: "legend", label: t("game.difficulty.legend"), desc: t("scramble.legendDesc"), roundSize: 12, secondsPerWord: 12 },
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
        setPicked([]);
        setPool(scramble(data.words[0].term));
        setStatus("idle");
      })
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
        setDifficulty(null);
      });
  }

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
      setTimeLeft((s) => {
        if (s <= 1) {
          stopTimer();
          fail();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, status, stopped, difficulty]);

  // Only read the word aloud once it's revealed — saying it during play gives the answer away.
  useEffect(() => {
    if (current && status !== "idle") speak(current.term);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, current?.id]);

  function fail() {
    if (status !== "idle" || stopped) return;
    setStatus("wrong");
    playWrongSound();
    setTimeout(() => setStopped(true), 1400);
  }

  function pick(letter: Letter) {
    if (!current || status !== "idle") return;
    const nextPicked = [...picked, letter];
    setPicked(nextPicked);
    setPool(pool.filter((l) => l.key !== letter.key));
    if (nextPicked.length < current.term.length) return;

    stopTimer();
    if (nextPicked.map((l) => l.char).join("") === current.term) {
      setStatus("correct");
      playCorrectSound();
      setScore((s) => s + 1);
      setTimeout(() => {
        const next = index + 1;
        setIndex(next);
        setPicked([]);
        setPool(words && next < words.length ? scramble(words[next].term) : []);
        setStatus("idle");
      }, 600);
    } else {
      fail();
    }
  }

  function undo() {
    if (status !== "idle" || picked.length === 0) return;
    const last = picked[picked.length - 1];
    setPicked(picked.slice(0, -1));
    setPool([...pool, last]);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title={t("scramble.title")}
        subtitle={`${t("scramble.subtitle")}${best !== null ? t("game.recordSubtitle", { n: best }) : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}

        {!words && !error && (
          <DifficultyPicker
            options={DIFFICULTIES}
            selected={difficulty?.key}
            loading={Boolean(difficulty && !words && !error)}
            onPick={load}
          />
        )}

        {current && !over && difficulty && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
              <span>{t("game.questionN", { n: index + 1, total: words!.length })}</span>
              <span>{t("game.scoreLabel", { n: score })}</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full transition-all", timeLeft <= 5 ? "bg-danger" : "bg-primary")}
                style={{ width: `${(timeLeft / difficulty.secondsPerWord) * 100}%` }}
              />
            </div>

            <Card className="mb-4 p-6 text-center">
              <div className="text-xl font-bold text-primary-hover">{current.meaning}</div>
              <div className="mt-1 text-xs text-fg-muted">{t("spelling.letterCount", { n: current.term.length })}</div>
            </Card>

            <div
              className={cn(
                "mb-4 flex min-h-14 flex-wrap items-center justify-center gap-1.5 rounded-ui border p-3 text-lg font-bold tracking-wide",
                status === "correct" && "border-success bg-success-soft",
                status === "wrong" && "border-danger bg-danger-soft",
                status === "idle" && "border-border bg-surface"
              )}
            >
              {status === "wrong" ? current.term : picked.map((l) => l.char).join("") || t("scramble.tapHint")}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {pool.map((l) => (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => pick(l)}
                  disabled={status !== "idle"}
                  className="h-12 w-12 rounded-ui border border-border bg-surface text-lg font-bold uppercase transition active:scale-95"
                >
                  {l.char}
                </button>
              ))}
            </div>

            <Button className="mt-4" block variant="outline" onClick={undo} disabled={status !== "idle" || picked.length === 0}>
              {t("scramble.undo")}
            </Button>
          </>
        )}

        {over && difficulty && (
          <Card className="p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">
              {score} / {words!.length}
            </div>
            <div className="mt-1 text-sm text-fg-muted">{stopped ? t("scramble.wrongStop") : t("spelling.correctSuffix")}</div>
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
                  setWords(null);
                  setDifficulty(null);
                }}
              >
                {t("game.changeDifficulty")}
              </Button>
              <Button block onClick={() => load(difficulty)}>
                {t("game.playAgain")}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
