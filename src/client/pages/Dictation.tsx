import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";
import { cn } from "../ui/cn";
import { speak } from "../lib/speak";
import { diffWords, type DiffWord } from "../lib/wordDiff";
import { shuffle } from "../lib/shuffle";
import { KeyboardIcon, ReplayIcon, SpeakerIcon } from "../components/icons";
import { useLanguage } from "../i18n/LanguageProvider";

const ROUND = 10;
const LEVELS = [1, 2, 3];

type StoryLevel = { guid: string; level: number };
type Story = { story: string; levels: StoryLevel[] };

/** Cat doan van thanh cau, giu cau 4-24 tu cho vua suc nghe chep. */
function toSentences(paragraphs: string[]): string[] {
  return paragraphs
    .flatMap((p) => p.split(/(?<=[.!?])\s+/))
    .map((s) => s.trim())
    .filter((s) => {
      const n = s.split(/\s+/).length;
      return n >= 4 && n <= 24;
    });
}

/**
 * Nghe chep chinh ta: TTS doc cau lay tu bai doc tin tuc theo level,
 * nguoi hoc go lai, cham diem tung tu.
 */
export default function Dictation() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [stories, setStories] = useState<Story[] | null>(null);
  const [error, setError] = useState("");
  const [level, setLevel] = useState<number | null>(null);
  const [sentences, setSentences] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{ words: DiffWord[]; score: number } | null>(null);
  const [scores, setScores] = useState<number[]>([]);

  useEffect(() => {
    api
      .readingStories()
      .then((res: { stories: Story[] }) => setStories(res.stories))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [navigate]);

  async function startLevel(lv: number) {
    if (!stories) return;
    setLevel(lv);
    setSentences(null);
    setError("");
    setIdx(0);
    setAnswer("");
    setResult(null);
    setScores([]);
    try {
      // Lay toi da 4 bai cua level do roi gom cau lai
      const guids = stories
        .map((s) => s.levels.find((l) => l.level === lv)?.guid)
        .filter((g): g is string => !!g)
        .slice(0, 4);
      const articles = await Promise.all(guids.map((g) => api.readingArticle(g)));
      const pool = shuffle(toSentences(articles.flatMap((a: { paragraphs: string[] }) => a.paragraphs))).slice(0, ROUND);
      if (!pool.length) return setError(t("dictation.empty"));
      setSentences(pool);
      speak(pool[0]);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(err.message);
    }
  }

  const current = sentences?.[idx];
  const done = sentences !== null && scores.length === sentences.length;
  const avg = useMemo(
    () => (scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0),
    [scores]
  );

  function check() {
    if (!current || !answer.trim() || result) return;
    const r = diffWords(current, answer);
    setResult(r);
    setScores((s) => [...s, r.score]);
  }

  function next() {
    if (!sentences) return;
    const n = idx + 1;
    setIdx(n);
    setAnswer("");
    setResult(null);
    if (sentences[n]) speak(sentences[n]);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backTo="/" title={t("dictation.title")} subtitle={t("dictation.subtitle")} />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}

        {/* Chon level */}
        {!error && level === null && (
          stories === null ? (
            <PageState>{t("common.loading")}</PageState>
          ) : (
            <Card className="flex flex-col items-center gap-4 p-8 text-center">
              <KeyboardIcon size={32} className="text-primary" />
              <div className="text-sm font-semibold">{t("dictation.pickLevel")}</div>
              <div className="flex gap-3">
                {LEVELS.map((lv) => (
                  <Button key={lv} variant="outline" onClick={() => startLevel(lv)}>
                    {t("dictation.level")} {lv}
                  </Button>
                ))}
              </div>
            </Card>
          )
        )}

        {level !== null && !error && sentences === null && <PageState>{t("common.loading")}</PageState>}

        {sentences && !done && current && (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between text-xs text-fg-muted">
              <span>
                {t("dictation.progress").replace("{n}", String(idx + 1)).replace("{total}", String(sentences.length))}
              </span>
              <span>
                {t("dictation.level")} {level}
              </span>
            </div>
            {/* Thanh tien do */}
            <div className="mb-4 flex gap-1">
              {sentences.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < scores.length ? (scores[i] >= 80 ? "bg-primary" : "bg-danger") : "bg-surface-muted",
                    i === idx && "ring-2 ring-ring"
                  )}
                />
              ))}
            </div>

            <Button
              variant="outline"
              className="mb-4 w-full"
              leftIcon={<SpeakerIcon size={16} />}
              onClick={() => speak(current)}
            >
              {t("dictation.listen")}
            </Button>

            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={t("dictation.placeholder")}
              disabled={!!result}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  result ? next() : check();
                }
              }}
            />

            {result && (
              <div className="mt-3 rounded-ui bg-surface-muted p-3 text-sm leading-relaxed" role="status">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-primary-hover">{t("dictation.check")}</span>
                  <span className={cn("text-xs font-bold", result.score >= 80 ? "text-primary" : "text-danger")}>
                    {result.score}%
                  </span>
                </div>
                {result.words.map((w, i) => (
                  <span key={i} className={w.ok ? "text-primary" : "font-semibold text-danger underline decoration-wavy"}>
                    {w.word}{" "}
                  </span>
                ))}
              </div>
            )}

            <Button className="mt-3 w-full" onClick={result ? next : check} disabled={!result && !answer.trim()}>
              {result ? t("dictation.next") : t("dictation.check")}
            </Button>
          </Card>
        )}

        {done && (
          <Card className="flex flex-col items-center gap-3 p-8 text-center">
            <div className="text-4xl font-extrabold text-primary-hover">{avg}%</div>
            <div className="text-sm font-semibold">{t("dictation.doneTitle")}</div>
            <div className="text-xs text-fg-muted">{t("dictation.doneDesc").replace("{n}", String(avg))}</div>
            <Button
              variant="outline"
              leftIcon={<ReplayIcon size={14} />}
              onClick={() => {
                setLevel(null);
                setSentences(null);
                setScores([]);
                setIdx(0);
              }}
            >
              {t("dictation.again")}
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
