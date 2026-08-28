import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { cn } from "../ui/cn";
import { CheckIcon, PuzzleIcon, ReplayIcon } from "./icons";
import { useLanguage } from "../i18n/LanguageProvider";

type QuizQuestion = { question: string; choices: string[]; answer: number; explanation: string };

/**
 * Quiz doc hieu 4 cau cho 1 bai reading. Bam "Lam quiz" moi goi AI (co cache DB).
 * Phim tat 1-4 de chon dap an.
 */
export function ReadingQuiz({ guid }: { guid: string }) {
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // picked[i] = index dap an nguoi hoc chon (undefined = chua tra loi)
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [current, setCurrent] = useState(0);

  // Bai khac -> quiz khac
  useEffect(() => {
    setQuestions(null);
    setPicked({});
    setCurrent(0);
    setError("");
  }, [guid]);

  function start() {
    setLoading(true);
    setError("");
    api
      .readingQuiz(guid)
      .then((res: { questions: QuizQuestion[] }) => setQuestions(res.questions))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  const q = questions?.[current];
  const answered = q ? picked[current] !== undefined : false;
  const done = questions ? Object.keys(picked).length === questions.length : false;
  const correctCount = questions ? questions.filter((qq, i) => picked[i] === qq.answer).length : 0;

  function choose(idx: number) {
    if (!q || answered) return;
    setPicked((p) => ({ ...p, [current]: idx }));
  }

  // Phim 1-4 chon dap an, Enter/Space sang cau ke
  useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) choose(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!questions) {
    return (
      <Card className="mt-6 flex flex-col items-center gap-2 p-6 text-center">
        <PuzzleIcon size={28} className="text-primary" />
        <div className="text-sm font-semibold">{t("quiz.title")}</div>
        <div className="text-xs text-fg-muted">{t("quiz.subtitle")}</div>
        {error && <div className="text-sm text-danger">{error}</div>}
        <Button className="mt-2" onClick={start} loading={loading} disabled={loading}>
          {loading ? t("quiz.generating") : t("quiz.start")}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="mt-6 p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-primary-hover">{t("quiz.title")}</span>
        <span className="text-xs text-fg-muted">
          {current + 1}/{questions.length}
        </span>
      </div>

      {/* Thanh tien do */}
      <div className="mb-4 flex gap-1">
        {questions.map((qq, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            aria-label={`${t("quiz.question")} ${i + 1}`}
            className={cn(
              "h-1.5 flex-1 rounded-full transition",
              picked[i] === undefined ? "bg-surface-muted" : picked[i] === qq.answer ? "bg-primary" : "bg-danger",
              i === current && "ring-2 ring-ring"
            )}
          />
        ))}
      </div>

      {q && (
        <>
          <div className="mb-3 text-sm font-semibold leading-relaxed">{q.question}</div>
          <div className="flex flex-col gap-2">
            {q.choices.map((choice, idx) => {
              const isPicked = picked[current] === idx;
              const isAnswer = q.answer === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => choose(idx)}
                  disabled={answered}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-ui border px-3 py-2 text-left text-sm transition",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    !answered && "cursor-pointer border-border bg-surface hover:border-primary hover:bg-primary-soft active:scale-[0.99]",
                    answered && isAnswer && "border-primary bg-primary-soft font-semibold",
                    answered && isPicked && !isAnswer && "border-danger bg-danger-soft",
                    answered && !isPicked && !isAnswer && "border-border opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      answered && isAnswer ? "border-primary bg-primary text-white" : "border-border text-fg-muted"
                    )}
                  >
                    {answered && isAnswer ? <CheckIcon size={13} /> : idx + 1}
                  </span>
                  {choice}
                </button>
              );
            })}
          </div>

          {answered && (
            <div className="mt-3 rounded-ui bg-surface-muted p-3 text-sm leading-relaxed" role="status">
              <span className={cn("font-bold", picked[current] === q.answer ? "text-primary" : "text-danger")}>
                {picked[current] === q.answer ? t("quiz.correct") : t("quiz.wrong")}
              </span>{" "}
              {q.explanation}
            </div>
          )}

          {answered && current < questions.length - 1 && (
            <Button className="mt-3 w-full" onClick={() => setCurrent(current + 1)}>
              {t("quiz.next")}
            </Button>
          )}
        </>
      )}

      {done && (
        <div className="mt-4 flex flex-col items-center gap-2 border-t border-border pt-4 text-center">
          <div className="text-2xl font-extrabold text-primary-hover">
            {correctCount}/{questions.length}
          </div>
          <div className="text-xs text-fg-muted">{t("quiz.done")}</div>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ReplayIcon size={14} />}
            onClick={() => {
              setPicked({});
              setCurrent(0);
            }}
          >
            {t("quiz.retry")}
          </Button>
        </div>
      )}
    </Card>
  );
}
