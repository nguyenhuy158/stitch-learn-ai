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

const ROUND_SIZE = 10;
const GAME_KEY = "spelling-game";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export default function Spelling() {
  const navigate = useNavigate();
  const [words, setWords] = useState<Word[] | null>(null);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const submittedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.gameLeaderboard(GAME_KEY).then((res) => setBest(res.myBest)).catch(() => {});
  }, []);

  function load() {
    submittedRef.current = false;
    setSubmitResult(null);
    api
      .wordPool(ROUND_SIZE)
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
      });
  }

  useEffect(load, [navigate]);
  useEffect(() => inputRef.current?.focus(), [index]);

  const current = words && index < words.length ? words[index] : null;
  const finished = words && index >= words.length;

  useEffect(() => {
    if (!finished || submittedRef.current) return;
    submittedRef.current = true;
    api
      .submitGameScore(GAME_KEY, score * 10, score)
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest, xpAwarded: res.xpAwarded }))
      .catch(() => {});
  }, [finished, score]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!current || status !== "idle") return;
    const ok = normalize(input) === normalize(current.term);
    setStatus(ok ? "correct" : "wrong");
    if (ok) {
      playCorrectSound();
      setScore((s) => s + 1);
    } else {
      playWrongSound();
    }
    setTimeout(() => {
      setInput("");
      setStatus("idle");
      setIndex((i) => i + 1);
    }, ok ? 500 : 1400);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title="Gõ chữ theo nghĩa"
        subtitle={`Đọc nghĩa, gõ đúng từ tiếng Anh.${best !== null ? ` Kỷ lục: ${best}` : ""}`}
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
              <span>
                Câu {index + 1}/{words!.length}
              </span>
              <span>Điểm: {score}</span>
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

        {finished && (
          <Card className="p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">
              {score} / {words!.length}
            </div>
            <div className="mt-1 text-sm text-fg-muted">câu đúng</div>
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
