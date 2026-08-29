import { useEffect, useState } from "react";
import { ReplayIcon, TranslateIcon } from "../components/icons";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";
import { cn } from "../ui/cn";
import { playWrongSound, playCorrectSound } from "../lib/gameSounds";
import { speak } from "../lib/speak";
import { useLanguage } from "../i18n/LanguageProvider";
import { matchTranslation } from "../../domain/translationMatch.js";
import { Spinner } from "../ui/Spinner";

type Sentence = { id: number; vietnamese: string; corrected: string };
type Checked = { words: { word: string; ok: boolean }[]; exact: boolean; score: number };

const GAME_KEY = "translation-recall";
const ROUND_SIZE = 5;

export default function TranslationRecall() {
  const navigate = useNavigate();
  const [sentences, setSentences] = useState<Sentence[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [checked, setChecked] = useState<Checked | null>(null);
  const [score, setScore] = useState(0);
  const [error, setError] = useState("");
  const [best, setBest] = useState<number | null>(null);
  const [submitResult, setSubmitResult] = useState<{ bestScore: number; isNewBest: boolean; xpAwarded: number } | null>(null);
  const { t } = useLanguage();

  function load() {
    setError("");
    setSentences(null);
    setSubmitResult(null);
    api
      .translationRecall(ROUND_SIZE)
      .then((data: { sentences: Sentence[] }) => {
        setSentences(data.sentences);
        setIndex(0);
        setScore(0);
        setAnswer("");
        setChecked(null);
      })
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }

  useEffect(load, [navigate]);
  useEffect(() => {
    api.gameLeaderboard(GAME_KEY).then((res) => setBest(res.myBest)).catch(() => {});
  }, []);

  const current = sentences && index < sentences.length ? sentences[index] : null;
  const finished = Boolean(sentences && index >= sentences.length);

  useEffect(() => {
    if (!finished || !sentences) return;
    api
      .submitGameScore(GAME_KEY, score * 10, score)
      .then((res) => setSubmitResult({ bestScore: res.bestScore, isNewBest: res.isNewBest, xpAwarded: res.xpAwarded }))
      .catch(() => {});
  }, [finished]);

  function check() {
    if (!current || checked || !answer.trim()) return;
    const result = matchTranslation(answer, current.corrected) as Checked;
    setChecked(result);
    if (result.exact) {
      setScore((s) => s + 1);
      playCorrectSound();
    } else {
      playWrongSound();
    }
    speak(current.corrected);
    // Ghi vao chung lich su dich de trang Dich cau gom nhom cac lan thu cua cau nay.
    api
      .saveRecallAttempt({
        vietnamese: current.vietnamese,
        translation: answer.trim(),
        corrected: current.corrected,
        correctionCount: result.words.filter((w) => !w.ok).length
      })
      .catch(() => {});
  }

  function next() {
    setIndex((i) => i + 1);
    setAnswer("");
    setChecked(null);
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        backTo="/"
        title={t("recall.title")}
        subtitle={`${t("recall.subtitle")}${best !== null ? t("game.recordSubtitle", { n: best }) : ""}`}
      />
      <main className="p-5 sm:p-9">
        {error && (
          <>
            <PageState tone="error">{error}</PageState>
            <Button block className="mt-4" onClick={() => navigate("/translation")} leftIcon={<TranslateIcon size={16} />}>
            {t("recall.goTranslate")}
          </Button>
          </>
        )}

        {!sentences && !error && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {current && sentences && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm text-fg-muted">
              <span>{t("game.questionN", { n: index + 1, total: sentences.length })}</span>
              <span>{t("game.scoreLabel", { n: score })}</span>
            </div>

            <Card className="mb-4 p-5 text-center text-lg font-bold text-primary-hover">{current.vietnamese}</Card>

            <Textarea
              value={answer}
              maxLength={500}
              autoFocus
              disabled={Boolean(checked)}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || e.shiftKey) return;
                e.preventDefault();
                if (checked) next();
                else check();
              }}
              placeholder={t("translation.placeholder")}
              className="min-h-[90px] w-full"
            />

            {checked && (
              <Card className="mt-4 p-4">
                <div className="flex flex-wrap gap-x-1.5 gap-y-1 text-base font-semibold">
                  {checked.words.map((w, i) => (
                    <span key={i} className={cn(w.ok ? "text-primary" : "text-danger underline decoration-wavy")}>
                      {w.word}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-sm text-fg-muted">
                  {checked.exact ? t("recall.perfect") : t("recall.almost", { n: Math.round(checked.score * 100) })}
                </div>
              </Card>
            )}

            <Button block className="mt-4" onClick={checked ? next : check} disabled={!answer.trim()}>
              {checked ? t("translation.next") : t("translation.submit")}
            </Button>
          </>
        )}

        {finished && sentences && (
          <Card className="p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">
              {score} / {sentences.length}
            </div>
            {submitResult && (
              <div className="mt-2 text-sm font-semibold text-accent">
                {submitResult.isNewBest ? t("game.newRecord") : t("game.record", { n: submitResult.bestScore })}
                {submitResult.xpAwarded > 0 ? ` · +${submitResult.xpAwarded} XP` : ""}
              </div>
            )}
            <Button block className="mt-4" onClick={load} leftIcon={<ReplayIcon size={16} />}>
            {t("game.playAgain")}
          </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
