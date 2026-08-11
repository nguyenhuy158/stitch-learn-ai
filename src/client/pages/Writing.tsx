import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { useLanguage } from "../i18n/LanguageProvider";

type Correction = { original: string; suggestion: string; explanation: string };
type Result = { corrected: string; overallFeedback: string; corrections: Correction[] };

export default function Writing() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [state, setState] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { t } = useLanguage();

  async function submit() {
    const trimmed = text.trim();
    if (!trimmed) {
      setState({ tone: "error", text: t("writing.emptyError") });
      return;
    }
    setSubmitting(true);
    setState({ tone: "info", text: t("writing.checking") });
    setResult(null);
    try {
      const data = await api.reviewWriting(trimmed);
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
      <PageHeader backTo="/lessons" backLabel={t("lessonDetail.backToList")} title={t("writing.title")} subtitle={t("writing.subtitle")} />
      <main className="grid gap-8 p-5 sm:p-9 lg:grid-cols-2">
        <div>
          <textarea
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("writing.placeholder")}
            className="min-h-[140px] w-full resize-y rounded-2xl border border-border bg-surface p-4 text-base text-fg focus:outline-2 focus:outline-primary"
          />
          <div className="mt-1.5 text-right text-[13px] text-fg-muted">{text.length}/2000</div>
          <Button block className="mt-3.5" onClick={submit} loading={submitting} disabled={submitting}>
            {t("writing.submit")}
          </Button>
          {state && (
            <div className={"mt-3 text-center text-sm " + (state.tone === "error" ? "text-danger" : "text-fg-muted")}>
              {state.text}
            </div>
          )}
        </div>

        {result && (
          <div>
            <div className="mb-2 text-[13px] font-bold uppercase text-primary-hover">
              {t("writing.correctedTitle")}
            </div>
            <Card className="p-4 text-[15px] leading-relaxed">{result.corrected}</Card>

            <div className="mb-2 mt-5 text-[13px] font-bold uppercase text-primary-hover">
              {t("writing.feedbackTitle")}
            </div>
            <div className="rounded-xl border-l-3 border-accent bg-warning-soft p-3 text-sm">
              {result.overallFeedback}
            </div>

            <div className="mb-2 mt-5 text-[13px] font-bold uppercase text-primary-hover">
              {t("writing.detailsTitle")}
            </div>
            {result.corrections.length === 0 ? (
              <div className="rounded-ui p-4 text-center font-semibold text-primary">
                {t("writing.noErrors")}
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {result.corrections.map((c, i) => (
                  <Card key={i} className="p-3.5">
                    <div className="flex flex-wrap items-baseline gap-2 text-sm">
                      <span className="text-danger line-through">{c.original}</span>
                      <span>→</span>
                      <span className="font-bold text-primary">
                        {c.suggestion}
                      </span>
                    </div>
                    <div className="text-[13px] text-fg-muted">{c.explanation}</div>
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
