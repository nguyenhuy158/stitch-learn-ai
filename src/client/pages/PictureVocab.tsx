import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { LoadingState } from "../ui/states";
import { useLanguage } from "../i18n/LanguageProvider";

type Item = { word: string; meaning_vi: string; level: string; word_form: string; image_url: string };
type Topic = { topic: string; lesson: string; slug: string; items: Item[] };

export default function PictureVocab() {
  const [topics, setTopics] = useState<Topic[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    api
      .pictureVocab()
      .then((data: { topics: Topic[] }) => {
        setTopics(data.topics);
        setActive(data.topics[0]?.slug ?? null);
      })
      .catch((err: any) => setError(t("pictureVocab.loadError") + err.message));
  }, [t]);

  const current = topics?.find((topic) => topic.slug === active);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        backTo="/"
        title={t("pictureVocab.title")}
        subtitle={t("pictureVocab.subtitle")}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && topics === null && <LoadingState />}

        {topics && (
          <div className="mb-5 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <button
                key={topic.slug}
                type="button"
                onClick={() => setActive(topic.slug)}
                className={
                  "rounded-full border px-3 py-1.5 text-xs font-semibold " +
                  (topic.slug === active
                    ? "border-primary bg-primary text-white"
                    : "border-border bg-surface text-fg-muted")
                }
              >
                {topic.lesson}
              </button>
            ))}
          </div>
        )}

        {current && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {current.items.map((item) => (
              <Card key={item.word} padded={false} className="overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.word}
                  loading="lazy"
                  className="h-28 w-full bg-white object-contain"
                />
                <div className="p-3">
                  <div className="text-sm font-bold text-primary-hover">{item.word}</div>
                  <div className="mt-0.5 text-xs font-semibold text-fg">{item.meaning_vi}</div>
                  <div className="mt-1.5 text-xs uppercase text-fg-muted">
                    {item.level} · {item.word_form}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
