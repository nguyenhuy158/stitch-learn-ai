import { useState } from "react";
import { api } from "../lib/api";
import { PageHeader } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Input";
import { useLanguage } from "../i18n/LanguageProvider";

const FAQ_KEYS = ["streak", "chat", "login", "writing"] as const;

export default function Help() {
  const { t } = useLanguage();
  const [message, setMessage] = useState("");
  const [state, setState] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const trimmed = message.trim();
    if (!trimmed) {
      setState({ tone: "error", text: t("help.emptyError") });
      return;
    }
    setSubmitting(true);
    setState({ tone: "info", text: t("help.sending") });
    try {
      await api.sendFeedback(trimmed);
      setState({ tone: "ok", text: t("help.sent") });
      setMessage("");
    } catch (err: any) {
      setState({ tone: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backTo="/profile" backLabel={t("help.backProfile")} title={t("help.title")} />
      <main className="p-5 sm:p-9">
        <div className="mb-3 mt-1 text-sm font-bold text-primary-hover">
          {t("help.faqTitle")}
        </div>
        <div className="flex flex-col gap-3">
          {FAQ_KEYS.map((key) => (
            <Card key={key} className="p-4">
              <div className="mb-1 text-sm font-bold">{t(`help.faq.${key}.q`)}</div>
              <div className="text-xs leading-relaxed text-fg-muted">{t(`help.faq.${key}.a`)}</div>
            </Card>
          ))}
        </div>

        <div className="mb-3 mt-6 text-sm font-bold text-primary-hover">
          {t("help.sendFeedback")}
        </div>
        <Textarea
          value={message}
          maxLength={1000}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("help.placeholder")}
          className="min-h-[100px] w-full"
        />
        <Button block className="mt-3" onClick={submit} loading={submitting} disabled={submitting}>
          {t("help.sendFeedback")}
        </Button>
        {state && (
          <div
            role={state.tone === "error" ? "alert" : "status"}
            className={
              "mt-2.5 text-center text-xs " +
              (state.tone === "ok" ? "text-primary" : state.tone === "error" ? "text-danger" : "text-fg-muted")
            }
          >
            {state.text}
          </div>
        )}
      </main>
    </div>
  );
}
