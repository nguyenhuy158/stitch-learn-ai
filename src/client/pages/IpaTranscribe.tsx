import { useState } from "react";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { speak } from "../lib/speak";
import { cleanIpaToken, lookupIpa } from "../lib/ipa";
import { useLanguage } from "../i18n/LanguageProvider";

type Result = { original: string; ipa: string | null };

export default function IpaTranscribe() {
  const { t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);

  function transcribe(e: React.FormEvent) {
    e.preventDefault();
    const tokens = query.trim().split(/\s+/).filter((token) => cleanIpaToken(token).length > 0);
    setResults(tokens.map((original) => ({ original, ipa: lookupIpa(original) })));
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader backTo="/" title={t("ipaTranscribe.title")} subtitle={t("ipaTranscribe.subtitle")} />
      <main className="p-5 sm:p-9">
        <form onSubmit={transcribe} className="mb-5 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("ipaTranscribe.placeholder")}
            autoComplete="off"
            className="min-h-11 flex-1 rounded-ui border border-border bg-surface px-3.5 text-base text-fg focus:outline-2 focus:outline-primary"
          />
          <Button type="submit" disabled={!query.trim()}>
            {t("ipaTranscribe.button")}
          </Button>
        </form>

        {results === null && <PageState>{t("ipaTranscribe.empty")}</PageState>}

        {results !== null && (
          <div className="flex flex-col gap-2.5">
            {results.map((r, i) => (
              <Card key={`${r.original}-${i}`} className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-fg">{r.original}</div>
                  {r.ipa ? (
                    <div className="mt-0.5 text-lg font-extrabold text-primary-hover">/{r.ipa}/</div>
                  ) : (
                    <div className="mt-0.5 text-sm text-danger">{t("ipaTranscribe.notFound")}</div>
                  )}
                </div>
                {r.ipa && (
                  <button
                    type="button"
                    onClick={() => speak(r.original)}
                    title={t("audio.speak")}
                    aria-label={t("audio.speak")}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ui bg-primary-hover text-lg text-white shadow-sm"
                  >
                    🔊
                  </button>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
