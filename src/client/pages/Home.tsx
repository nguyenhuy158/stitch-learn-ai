import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../ui/Spinner";
import { BookIcon, ChatIcon } from "../components/icons";
import { useLanguage } from "../i18n/LanguageProvider";

type Lesson = { id: number; title: string; sub_title?: string; status?: string };

const SUGGESTION_KEYS = [
  { key: "pronunciation", to: "/chat" },
  { key: "mistakes", to: "/mistakes" },
  { key: "coffee", to: "/chat" },
] as const;

const TOOL_KEYS = [
  { key: "tutor", to: "/chat", icon: "🎓" },
  { key: "flashcards", to: "/flashcards", icon: "🗂️" },
  { key: "challenge", to: "/challenge", icon: "🎯" },
  { key: "wordGame", to: "/word-game", icon: "🎮" },
  { key: "listeningGame", to: "/listening-game", icon: "🔊" },
  { key: "matchingGame", to: "/matching-game", icon: "🧩" },
  { key: "spellingGame", to: "/spelling-game", icon: "⌨️" },
  { key: "wordRace", to: "/word-race", icon: "🌧️" },
  { key: "gamesLeaderboard", to: "/games-leaderboard", icon: "🏅" },
  { key: "pictureVocab", to: "/picture-vocab", icon: "🖼️" },
  { key: "saved", to: "/saved", icon: "⭐" },
  { key: "rankings", to: "/rankings", icon: "🏆" },
] as const;

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[] | null>(null);

  useEffect(() => {
    api.me().then((data) => {
      if (!data.user) return navigate("/login");
      setUser(data.user);
    });
    api.lessons().then((data) => setLessons(Array.isArray(data) ? data.slice(0, 3) : []));
  }, [navigate]);

  const continueLesson = lessons?.find((l) => l.status === "active") || lessons?.[0];

  return (
    <div className="mx-auto max-w-3xl p-5 sm:p-9">
      <header className="mb-5">
        <h1 className="m-0 text-2xl font-extrabold">{t("home.greeting")}{user?.name ? `, ${user.name}` : ""} 👋</h1>
        <p className="mt-1 text-sm text-fg-muted">{t("home.subtitle")}</p>
      </header>

      {/* Khong dung <Card>: class bg-surface cua no thang bg-primary-hover theo thu tu CSS
          (cn() khong merge nhu tailwind-merge), lam the streak trang tren trang, chu trang mat hut. */}
      <div className="mb-5 rounded-ui border border-border bg-primary-hover p-4 text-white shadow-sm">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span>🔥 {t("home.streakDays", { n: user?.streak ?? 0 })}</span>
          <span>⭐ {user?.xp ?? 0} XP</span>
        </div>
        {continueLesson ? (
          <div className="mt-3">
            <div className="text-xs uppercase text-white/70">{t("home.continueLearning")}</div>
            <div className="text-lg font-bold">{continueLesson.title}</div>
            <Link
              to={`/lesson?id=${continueLesson.id}`}
              className="mt-2 inline-block rounded-ui bg-white px-4 py-2 text-sm font-bold text-primary-hover no-underline"
            >
              {t("home.continueButton")}
            </Link>
          </div>
        ) : (
          !lessons && (
            <div className="mt-3">
              <Spinner size={16} />
            </div>
          )
        )}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="m-0 text-base font-bold">{t("home.lessonsTitle")}</h2>
        <Link to="/lessons" className="text-sm font-semibold text-primary no-underline">
          {t("home.viewAll")}
        </Link>
      </div>

      <div className="mb-7 flex items-center gap-2 overflow-x-auto pb-2">
        {(lessons || []).map((l) => (
          <Link
            key={l.id}
            to={`/lesson?id=${l.id}`}
            className="w-40 shrink-0 rounded-2xl bg-surface p-3.5 shadow-sm no-underline"
          >
            <BookIcon size={18} />
            <div className="mt-2 truncate text-sm font-semibold text-fg">{l.title}</div>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-base font-bold">{t("home.suggestionsTitle")}</h2>
      <div className="mb-7 flex gap-3 overflow-x-auto pb-2">
        {SUGGESTION_KEYS.map((s) => (
          <Link key={s.key} to={s.to} className="w-56 shrink-0 rounded-2xl bg-surface p-4 shadow-sm no-underline">
            <ChatIcon size={20} />
            <div className="mt-2 text-sm font-bold text-fg">{t(`home.suggestion.${s.key}.title`)}</div>
            <div className="mt-1 text-xs text-fg-muted">{t(`home.suggestion.${s.key}.desc`)}</div>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-base font-bold">{t("home.toolsTitle")}</h2>
      <div className="grid grid-cols-2 gap-3">
        {TOOL_KEYS.map((tool) => (
          <Link key={tool.key} to={tool.to} className="rounded-2xl bg-surface p-4 text-center shadow-sm no-underline">
            <div className="text-2xl">{tool.icon}</div>
            <div className="mt-1.5 text-sm font-semibold text-fg">{t(`home.tool.${tool.key}`)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
