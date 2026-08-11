import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";

type VocabItem = { id: number; term: string; meaning: string; example?: string; lesson_title: string };

export default function Saved() {
  const navigate = useNavigate();
  const [items, setItems] = useState<VocabItem[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api.savedVocab();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (isUnauthorized(err)) return navigate("/login");
      setError("Không tải được: " + err.message);
    }
  }, [navigate]);

  useEffect(() => {
    load();
  }, [load]);

  async function unsave(id: number) {
    await api.saveVocab(id, false);
    load();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader backTo="/" title="Từ vựng đã lưu" />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && items === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && items && items.length === 0 && (
          <PageState>Chưa lưu từ vựng nào. Vào Thẻ ghi nhớ và bấm ★ để lưu.</PageState>
        )}
        {!error && items && items.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <Card key={item.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <div className="text-base font-bold text-primary-hover">{item.term}</div>
                  <div className="mt-0.5 text-[13px] font-semibold text-accent">{item.meaning}</div>
                  {item.example && <div className="mt-1.5 text-[13px] italic text-fg-muted">"{item.example}"</div>}
                  <div className="mt-1.5 text-[11px] uppercase text-fg-muted">{item.lesson_title}</div>
                </div>
                <button
                  type="button"
                  onClick={() => unsave(item.id)}
                  title="Bỏ lưu"
                  className="shrink-0 border-none bg-transparent text-xl text-fg-muted"
                >
                  ★
                </button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
