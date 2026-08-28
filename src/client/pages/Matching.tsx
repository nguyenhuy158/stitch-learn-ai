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
type Tile = { key: string; wordId: number; text: string; kind: "term" | "meaning" };
type Difficulty = { key: string; label: string; desc: string; pairs: number; totalSeconds: number };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const GAME_KEY = "matching-game";

/** Fewer moves = more points; a perfect run (moves === pairs) scores max. */
function scoreFor(moves: number, pairs: number) {
  return Math.max(50, 500 - Math.max(0, moves - pairs) * 30);
}

export default function Matching() {
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Tile[]>([]);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [failed, setFailed] = useState(false);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const submittedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { t } = useLanguage();

  const DIFFICULTIES: Difficulty[] = [
    { key: "easy", label: t("game.difficulty.easy"), desc: t("matching.easyDesc"), pairs: 6, totalSeconds: 60 },
    { key: "hard", label: t("game.difficulty.hard"), desc: t("matching.hardDesc"), pairs: 8, totalSeconds: 45 },
    { key: "legend", label: t("game.difficulty.legend"), desc: t("matching.legendDesc"), pairs: 10, totalSeconds: 35 },
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
    setTiles(null);
    submittedRef.current = false;
    setSubmitResult(null);
    setFailed(false);
    setTimeLeft(d.totalSeconds);
    api
      .wordPool(d.pairs, d.key)
      .then((data: { words: Word[] }) => {
        const cards: Tile[] = [];
        data.words.forEach((w) => {
          cards.push({ key: `t${w.id}`, wordId: w.id, text: w.term, kind: "term" });
          cards.push({ key: `m${w.id}`, wordId: w.id, text: w.meaning, kind: "meaning" });
        });
        setTiles(shuffle(cards));
        setMatched(new Set());
        setSelected([]);
        setMoves(0);
      })
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
        setDifficulty(null);
      });
  }

  const won = tiles && difficulty && matched.size === difficulty.pairs;
  const over = won || failed;

  useEffect(() => {
    if (!tiles || over || !difficulty) return;
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          stopTimer();
          setFailed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return stopTimer;
  }, [tiles, over, difficulty]);

  function pick(tile: Tile) {
    if (over || matched.has(tile.wordId) || selected.some((s) => s.key === tile.key) || selected.length === 2) return;
    // Tapping an English tile also reads it aloud — free listening practice,
    // and the tap itself is the user gesture the speech engine needs.
    if (tile.kind === "term") speak(tile.text);
    const next = [...selected, tile];
    setSelected(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = next;
      if (a.wordId === b.wordId && a.kind !== b.kind) {
        playCorrectSound();
        setTimeout(() => {
          setMatched((prev) => new Set(prev).add(a.wordId));
          setSelected([]);
        }, 350);
      } else {
        playWrongSound();
        setWrongPair([a.key, b.key]);
        stopTimer();
        setTimeout(() => setFailed(true), 700);
      }
    }
  }

  useEffect(() => {
    if (!over || submittedRef.current || !difficulty) return;
    submittedRef.current = true;
    api
      .submitGameScore(GAME_KEY, won ? scoreFor(moves, difficulty.pairs) : 0)
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest, xpAwarded: res.xpAwarded }))
      .catch(() => {});
  }, [over, won, moves, difficulty]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title={t("matching.title")}
        subtitle={`${t("matching.subtitle")}${best !== null ? t("game.recordSubtitle", { n: best }) : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}

        {!tiles && !error && (
          <DifficultyPicker
            options={DIFFICULTIES}
            selected={difficulty?.key}
            loading={Boolean(difficulty && !tiles && !error)}
            onPick={load}
          />
        )}

        {tiles && difficulty && !over && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
              <span>{t("matching.moves", { n: moves })}</span>
              <span>{t("matching.timeLeft", { n: timeLeft })}</span>
            </div>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn("h-full rounded-full transition-all", timeLeft <= 8 ? "bg-danger" : "bg-primary")}
                style={{ width: `${(timeLeft / difficulty.totalSeconds) * 100}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {tiles.map((tile) => {
                const isMatched = matched.has(tile.wordId);
                const isSelected = selected.some((s) => s.key === tile.key);
                const isWrong = wrongPair.includes(tile.key);
                return (
                  <button
                    key={tile.key}
                    type="button"
                    disabled={isMatched}
                    onClick={() => pick(tile)}
                    className={cn(
                      "flex min-h-20 items-center justify-center rounded-ui border p-3 text-center text-sm transition active:scale-[0.98]",
                      isMatched && "border-success bg-success-soft opacity-40",
                      !isMatched && isWrong && "border-danger bg-danger-soft",
                      !isMatched && !isWrong && isSelected && "border-primary bg-primary-soft",
                      !isMatched && !isWrong && !isSelected && "border-border bg-surface"
                    )}
                  >
                    {tile.text}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {over && difficulty && (
          <Card className="mt-5 p-5 text-center">
            <div className="text-lg font-bold text-primary-hover">
              {won ? t("matching.won", { moves, score: scoreFor(moves, difficulty.pairs) }) : t("matching.lost")}
            </div>
            {!won && (
              <div className="mt-1 text-sm text-fg-muted">
                {failed && timeLeft === 0 ? t("matching.timeUp") : t("matching.wrongMatch")}
              </div>
            )}
            {submitResult && (
              <div className="mt-2 text-sm font-semibold text-accent">
                {submitResult.isNewBest ? t("matching.newRecord") : t("matching.bestScore", { score: submitResult.bestScore })}
                {submitResult.xpAwarded > 0 ? ` · +${submitResult.xpAwarded} XP` : ""}
              </div>
            )}
            <div className="mt-4 flex gap-3">
              <Button
                block
                variant="outline"
                onClick={() => {
                  setTiles(null);
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
