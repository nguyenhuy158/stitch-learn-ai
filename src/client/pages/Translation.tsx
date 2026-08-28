import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CheckIcon } from "../components/icons";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Textarea } from "../ui/Input";
import { useLanguage } from "../i18n/LanguageProvider";

type Correction = { original: string; suggestion: string; explanation: string };
type Result = { corrected: string; overallFeedback: string; corrections: Correction[] };
type Attempt = {
  id: number;
  vietnamese: string;
  translation: string;
  corrected: string;
  feedback: string;
  correctionCount: number;
  createdAt: string;
};
type Exercise = { vietnamese: string; term: string };

export default function Translation() {
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [history, setHistory] = useState<Attempt[]>([]);
  // Cau ke duoc tai san trong luc nguoi hoc go, nen bam "Cau tiep theo" la co ngay.
  const nextExercise = useRef<Promise<Exercise> | null>(null);
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
    const pending = nextExercise.current ?? api.translationExercise();
    nextExercise.current = null;
    pending
      .then((data: Exercise) => {
        setExercise(data);
        // Ngay sau khi co cau hien tai, tai truoc cau ke tiep.
        const prefetch = api.translationExercise();
        prefetch.catch(() => {}); // giu im lang, loi se hien khi that su dung toi
        nextExercise.current = prefetch;
      })
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setState({ tone: "error", text: err.message });
      });
  }

  useEffect(loadExercise, [navigate]);

  useEffect(() => {
    api.translationHistory().then((res: { attempts: Attempt[] }) => setHistory(res.attempts)).catch(() => {});
  }, []);

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
      api.translationHistory().then((res: { attempts: Attempt[] }) => setHistory(res.attempts)).catch(() => {});
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
            onKeyDown={(e) => {
              // Ban dich chi 1 cau nen Enter = gui luon; Shift+Enter neu can xuong dong.
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (submitting || !exercise) return;
                if (result) loadExercise(); // da cham xong -> Enter la sang cau moi
                else submit();
              }
            }}
            placeholder={t("translation.placeholder")}
            className="min-h-[100px] w-full"
            disabled={!exercise}
          />
          <div className="mt-1.5 text-right text-xs text-fg-muted">{translation.length}/500</div>
          <Button block className="mt-3.5" onClick={submit} loading={submitting} disabled={submitting || !exercise} leftIcon={<CheckIcon size={16} />}>
            {t("translation.submit")}
          </Button>
          {result && (
            <Button block variant="secondary" className="mt-2" onClick={loadExercise} leftIcon={<ArrowRightIcon size={16} />}>
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

        {!result && (
          <div className="hidden rounded-ui border border-dashed border-border p-6 text-center text-sm text-fg-muted lg:block">
            {t("translation.waitingResult")}
          </div>
        )}

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
                      <ArrowRightIcon size={14} className="text-fg-muted" aria-hidden="true" />
                      <span className="font-bold text-primary">{c.suggestion}</span>
                    </div>
                    <div className="text-xs text-fg-muted">{c.explanation}</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <section className="lg:col-span-2">
          <div className="mb-2 text-xs font-bold uppercase text-primary-hover">{t("translation.historyTitle")}</div>
          {history.length === 0 ? (
            <div className="rounded-ui border border-dashed border-border p-4 text-center text-sm text-fg-muted">
              {t("translation.historyEmpty")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((a) => (
                <Card key={a.id} className="p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">{a.vietnamese}</span>
                    <span className={"text-xs " + (a.correctionCount === 0 ? "text-primary" : "text-fg-muted")}>
                      {a.correctionCount === 0
                        ? t("translation.historyPerfect")
                        : t("translation.historyErrors", { n: a.correctionCount })}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-fg-muted">{a.translation}</div>
                  <div className="mt-0.5 text-sm text-primary-hover">{a.corrected}</div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
