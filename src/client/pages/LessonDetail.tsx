import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";
import { useLanguage } from "../i18n/LanguageProvider";

type Vocab = { term: string; meaning: string; example?: string };
type Lesson = { title: string; sub_title?: string };

// Convention preserved from the old static lesson.html: /lesson?id=N (query param, not a path param).
export default function LessonDetail() {
  const [params] = useSearchParams();
  const id = params.get("id");
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocab, setVocab] = useState<Vocab[] | null>(null);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    if (!id) {
      setError(t("lessonDetail.missingId"));
      return;
    }
    (async () => {
      try {
        const data = await api.lessonDetail(id);
        setLesson(data.lesson);
        setVocab(data.vocab);
      } catch (err: any) {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      }
    })();
  }, [id, navigate, t]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        backTo="/lessons"
        backLabel={t("lessonDetail.backToList")}
        title={error ? t("lessonDetail.loadError") : lesson?.title ?? t("common.loading")}
        subtitle={lesson?.sub_title}
      />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && vocab === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && vocab && vocab.length === 0 && <PageState>{t("lessonDetail.empty")}</PageState>}
        {!error && vocab && vocab.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vocab.map((item, i) => (
              <Card key={i} className="p-4 sm:p-5">
                <div className="text-lg font-bold text-primary-hover">{item.term}</div>
                <div className="mt-0.5 text-sm font-semibold text-fg">{item.meaning}</div>
                {item.example && <div className="mt-2 text-sm italic leading-relaxed text-fg-muted">"{item.example}"</div>}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
