import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Textarea } from "../ui/Input";
import { useLanguage } from "../i18n/LanguageProvider";

type Correction = { original: string; suggestion: string; explanation: string };
type Result = { corrected: string; overallFeedback: string; corrections: Correction[] };

export default function Translation() {
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<{ vietnamese: string; term: string } | null>(null);
  const [translation, setTranslation] = useState("");
  const [state, setState] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  function loadExercise() {
    setExercise(null);
    setResult(null);
    setTranslation("");
    setState(null);
    api.translationExercise().then(setExercise).catch((err) => {
      if (isUnauthorized(err)) return navigate("/login");
      setState({ tone: "error", text: err.message });
    });
  }

  useEffect(loadExercise, [navigate]);

  async function submit() {
    if (!exercise) return;
    const trimmed = translation.trim();
    if (!trimmed) {
      setState({ tone: "error", text: t("translation.emptyError") });
      return;
    }
    setSubmitting(true);
    setState({ tone: "info", text: t("translation.checking") });
    setResult(null);
    try {
      const data = await api.reviewTranslation(exercise.vietnamese, trimmed);
      setState(null);
      setResult(data);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setState({ tone: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader backTo="/lessons" backLabel={t("lessonDetail.backToList")} title={t("translation.title")} subtitle={t("translation.subtitle")} />
      <main className="grid gap-8 p-5 sm:p-9 lg:grid-cols-2">
        <div>
          {exercise ? (
            <Card className="mb-3.5 p-4 text-lg font-bold text-primary-hover">{exercise.vietnamese}</Card>
          ) : (
            !state && <div className="p-4 text-center text-sm text-fg-muted">{t("translation.loading")}</div>
          )}
          <Textarea
            value={translation}
            maxLength={500}
            onChange={(e) => setTranslation(e.target.value)}
            placeholder={t("translation.placeholder")}
            className="min-h-[100px] w-full"
            disabled={!exercise}
          />
          <div className="mt-1.5 text-right text-xs text-fg-muted">{translation.length}/500</div>
          <Button block className="mt-3.5" onClick={submit} loading={submitting} disabled={submitting || !exercise}>
            {t("translation.submit")}
          </Button>
          {result && (
            <Button block variant="secondary" className="mt-2" onClick={loadExercise}>
              {t("translation.next")}
            </Button>
          )}
          {state && (
            <div
              role={state.tone === "error" ? "alert" : "status"}
              className={"mt-3 text-center text-sm " + (state.tone === "error" ? "text-danger" : "text-fg-muted")}
            >
              {state.text}
            </div>
          )}
        </div>

        {result && (
          <div>
            <div className="mb-2 text-xs font-bold uppercase text-primary-hover">
              {t("translation.correctedTitle")}
            </div>
            <Card className="p-4 text-sm leading-relaxed">{result.corrected}</Card>

            <div className="mb-2 mt-5 text-xs font-bold uppercase text-primary-hover">
              {t("translation.feedbackTitle")}
            </div>
            <div className="rounded-xl border-l-3 border-accent bg-warning-soft p-3 text-sm">
              {result.overallFeedback}
            </div>

            <div className="mb-2 mt-5 text-xs font-bold uppercase text-primary-hover">
              {t("translation.detailsTitle")}
            </div>
            {result.corrections.length === 0 ? (
              <div className="rounded-ui p-4 text-center font-semibold text-primary">
                {t("translation.noErrors")}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {result.corrections.map((c, i) => (
                  <Card key={i} className="p-4">
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="text-danger line-through">{c.original}</span>
                      <span>→</span>
                      <span className="font-bold text-primary">{c.suggestion}</span>
                    </div>
                    <div className="text-xs text-fg-muted">{c.explanation}</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
