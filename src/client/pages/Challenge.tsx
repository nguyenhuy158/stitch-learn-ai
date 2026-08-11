import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";

type Question = { vocabId: number; term: string; correctMeaning: string; choices: string[] };

export default function Challenge() {
  const navigate = useNavigate();
  const [state, setState] = useState<{ completed: boolean; xpAwarded: number; questions: Question[] } | null>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ xpAwarded: number; score: number } | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    api
      .dailyChallenge()
      .then(setState)
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [navigate]);

  function pick(vocabId: number, meaning: string) {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [vocabId]: meaning }));
  }

  async function submit() {
    if (!state || submitting) return;
    const score = state.questions.filter((q) => answers[q.vocabId] === q.correctMeaning).length;
    setSubmitting(true);
    try {
      const res = await api.completeDailyChallenge(score);
      setResult({ xpAwarded: res.xpAwarded, score });
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const allAnswered = state?.questions.every((q) => answers[q.vocabId]) ?? false;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader backTo="/" title={t("challenge.title")} subtitle={t("challenge.subtitle")} />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && state === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && state?.completed && !result && (
          <PageState>
            {t("challenge.doneToday", { n: state.xpAwarded })}
          </PageState>
        )}
        {!error && state && !state.completed && state.questions.length === 0 && (
          <PageState>{t("challenge.notEnoughVocab")}</PageState>
        )}

        {!error && result && (
          <Card className="mb-5 p-5 text-center">
            <div className="text-2xl font-extrabold text-primary-hover">
              {result.score} / {state?.questions.length}
            </div>
            <div className="mt-1 text-sm text-fg-muted">{t("challenge.correctSuffix", { n: result.xpAwarded })}</div>
          </Card>
        )}

        {!error && state && !state.completed && state.questions.length > 0 && !result && (
          <>
            <div className="flex flex-col gap-4">
              {state.questions.map((q, i) => (
                <Card key={q.vocabId} className="p-4">
                  <div className="mb-2.5 text-sm text-fg-muted">{t("challenge.questionN", { n: i + 1 })}</div>
                  <div className="mb-3 text-lg font-bold text-primary-hover">{q.term}</div>
                  <div className="flex flex-col gap-2">
                    {q.choices.map((choice) => (
                      <button
                        key={choice}
                        type="button"
                        onClick={() => pick(q.vocabId, choice)}
                        className={cn(
                          "rounded-ui border px-3.5 py-2.5 text-left text-sm",
                          answers[q.vocabId] === choice ? "border-primary bg-primary-soft" : "border-border bg-surface"
                        )}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
            <Button block className="mt-5" disabled={!allAnswered || submitting} onClick={submit}>
              {t("challenge.submit")}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
