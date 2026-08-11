import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { Tabs } from "../ui/Tabs";
import { Spinner } from "../ui/Spinner";
import { EmptyState } from "../ui/states";
import { LockIcon, CheckIcon, BookIcon } from "../components/icons";
import { cn } from "../ui/cn";

type Lesson = { id: number; title: string; sub_title?: string; status?: "locked" | "active" | "completed" };

const TABS = [
  { id: "all", label: "Tất cả" },
  { id: "grammar", label: "Ngữ pháp" },
  { id: "vocab", label: "Từ vựng" },
  { id: "ai", label: "Luyện tập AI" },
];

// The old bundle only ever populated "Tất cả" / "Từ vựng" with the same full list — there is no
// per-lesson category data in the backend, so "Ngữ pháp" and "Luyện tập AI" faithfully show empty.
const TABS_WITH_DATA = new Set(["all", "vocab"]);

export default function Lessons() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");
  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .lessons()
      .then((data) => setLessons(Array.isArray(data) ? data : []))
      .catch((err) => {
        if (isUnauthorized(err)) return navigate("/login");
        setError(err.message);
      });
  }, [navigate]);

  const showLessons = TABS_WITH_DATA.has(tab) ? lessons : [];

  return (
    <div className="mx-auto max-w-3xl">
      <header className="px-5 pb-5 pt-6 sm:px-9">
        <h1 className="m-0 text-2xl font-extrabold">Lộ trình học</h1>
      </header>
      <div className="px-5 sm:px-9">
        <Tabs items={TABS} active={tab} onChange={setTab} />
      </div>
      <main className="p-5 sm:p-9">
        {error && <div className="py-10 text-center text-sm text-danger">{error}</div>}
        {!error && lessons === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && lessons && showLessons && showLessons.length === 0 && (
          <EmptyState title="Chưa có nội dung" description="Danh mục này chưa có bài học nào." icon={<BookIcon size={28} />} />
        )}
        {!error && showLessons && showLessons.length > 0 && (
          <ol className="flex flex-col gap-3">
            {showLessons.map((lesson, i) => {
              const locked = lesson.status === "locked";
              const completed = lesson.status === "completed";
              const row = (
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-2xl bg-surface p-4 shadow-sm transition",
                    locked ? "opacity-60" : "hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold",
                      completed ? "bg-primary text-primary-fg" : locked ? "bg-surface-muted text-fg-muted" : "bg-primary-soft text-primary"
                    )}
                  >
                    {completed ? <CheckIcon size={18} /> : locked ? <LockIcon size={16} /> : i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{lesson.title}</div>
                    {lesson.sub_title && <div className="truncate text-sm text-fg-muted">{lesson.sub_title}</div>}
                  </div>
                </div>
              );
              return (
                <li key={lesson.id}>
                  {locked ? row : <Link to={`/lesson?id=${lesson.id}`} className="no-underline">{row}</Link>}
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
