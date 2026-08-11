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
type Tile = { key: string; wordId: number; text: string; kind: "term" | "meaning" };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PAIRS = 8;
const GAME_KEY = "matching-game";

/** Fewer moves = more points; a perfect run (moves === PAIRS) scores max. */
function scoreFor(moves: number) {
  return Math.max(50, 500 - Math.max(0, moves - PAIRS) * 30);
}

export default function Matching() {
  const navigate = useNavigate();
  const [tiles, setTiles] = useState<Tile[] | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Tile[]>([]);
  const [wrongPair, setWrongPair] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean } | null>(null);
  const submittedRef = useRef(false);

  useEffect(() => {
    api.gameLeaderboard(GAME_KEY).then((res) => setBest(res.myBest)).catch(() => {});
  }, []);

  function load() {
    submittedRef.current = false;
    setSubmitResult(null);
    api
      .wordPool(PAIRS)
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
      });
  }

  useEffect(load, [navigate]);

  function pick(tile: Tile) {
    if (matched.has(tile.wordId) || selected.some((s) => s.key === tile.key) || selected.length === 2) return;
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
        setTimeout(() => {
          setWrongPair([]);
          setSelected([]);
        }, 600);
      }
    }
  }

  const done = tiles && matched.size === PAIRS;

  useEffect(() => {
    if (!done || submittedRef.current) return;
    submittedRef.current = true;
    api
      .submitGameScore(GAME_KEY, scoreFor(moves))
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest }))
      .catch(() => {});
  }, [done, moves]);

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title="Ghép thẻ"
        subtitle={`Tìm cặp từ - nghĩa khớp nhau. Ít lượt hơn = điểm cao hơn.${best !== null ? ` Kỷ lục: ${best}` : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && tiles === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {tiles && (
          <>
            <div className="mb-3 text-center text-sm text-fg-muted">Lượt: {moves}</div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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
                      "flex min-h-20 items-center justify-center rounded-ui border p-2.5 text-center text-sm",
                      isMatched && "border-green-500 bg-green-500/10 opacity-40",
                      !isMatched && isWrong && "border-red-500 bg-red-500/10",
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

        {done && (
          <Card className="mt-5 p-5 text-center">
            <div className="text-lg font-bold text-primary-hover">Xong! {moves} lượt — {scoreFor(moves)} điểm</div>
            {submitResult && (
              <div className="mt-2 text-sm font-semibold text-accent">
                {submitResult.isNewBest ? "Kỷ lục mới!" : `Kỷ lục: ${submitResult.bestScore}`}
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
