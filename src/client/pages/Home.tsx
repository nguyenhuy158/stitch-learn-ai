import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { Spinner } from "../ui/Spinner";
import { BookIcon, ChatIcon } from "../components/icons";

type Lesson = { id: number; title: string; sub_title?: string; status?: string };

const SUGGESTIONS = [
  { title: "Sửa lỗi phát âm", desc: "Luyện phát âm cùng Gemini", to: "/chat" },
  { title: "Ôn lỗi sai", desc: "Xem lại các lỗi đã mắc", to: "/mistakes" },
  { title: "Trò Chuyện Cà Phê", desc: "Chat chủ đề tự do", to: "/chat" },
];

const TOOLS = [
  { title: "Gia sư AI", to: "/chat", icon: "🎓" },
  { title: "Thẻ ghi nhớ", to: "/flashcards", icon: "🗂️" },
  { title: "Thử thách hôm nay", to: "/challenge", icon: "🎯" },
  { title: "Đoán nghĩa từ", to: "/word-game", icon: "🎮" },
  { title: "Nghe đoán từ", to: "/listening-game", icon: "🔊" },
  { title: "Ghép thẻ", to: "/matching-game", icon: "🧩" },
  { title: "Gõ chữ theo nghĩa", to: "/spelling-game", icon: "⌨️" },
  { title: "Từ rơi", to: "/word-race", icon: "🌧️" },
  { title: "Xếp hạng trò chơi", to: "/games-leaderboard", icon: "🏅" },
  { title: "Đã lưu", to: "/saved", icon: "⭐" },
  { title: "Xếp hạng", to: "/rankings", icon: "🏆" },
];

export default function Home() {
  const navigate = useNavigate();
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
        <h1 className="m-0 text-2xl font-extrabold">Xin chào{user?.name ? `, ${user.name}` : ""} 👋</h1>
        <p className="mt-1 text-sm text-fg-muted">Tiếp tục hành trình học tiếng Anh của bạn nào.</p>
      </header>

      {/* Khong dung <Card>: class bg-surface cua no thang bg-primary-hover theo thu tu CSS
          (cn() khong merge nhu tailwind-merge), lam the streak trang tren trang, chu trang mat hut. */}
      <div className="mb-5 rounded-ui border border-border bg-primary-hover p-4 text-white shadow-sm">
        <div className="flex items-center justify-between text-sm text-white/80">
          <span>🔥 Chuỗi {user?.streak ?? 0} ngày</span>
          <span>⭐ {user?.xp ?? 0} XP</span>
        </div>
        {continueLesson ? (
          <div className="mt-3">
            <div className="text-xs uppercase text-white/70">Tiếp tục học</div>
            <div className="text-lg font-bold">{continueLesson.title}</div>
            <Link
              to={`/lesson?id=${continueLesson.id}`}
              className="mt-2 inline-block rounded-ui bg-white px-4 py-2 text-sm font-bold text-primary-hover no-underline"
            >
              Tiếp tục học →
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
        <h2 className="m-0 text-base font-bold">Bài học</h2>
        <Link to="/lessons" className="text-sm font-semibold text-primary no-underline">
          Xem tất cả
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

      <h2 className="mb-3 text-base font-bold">Gemini Gợi ý</h2>
      <div className="mb-7 flex gap-3 overflow-x-auto pb-2">
        {SUGGESTIONS.map((s) => (
          <Link key={s.title} to={s.to} className="w-56 shrink-0 rounded-2xl bg-surface p-4 shadow-sm no-underline">
            <ChatIcon size={20} />
            <div className="mt-2 text-sm font-bold text-fg">{s.title}</div>
            <div className="mt-1 text-xs text-fg-muted">{s.desc}</div>
          </Link>
        ))}
      </div>

      <h2 className="mb-3 text-base font-bold">Công cụ học tập</h2>
      <div className="grid grid-cols-2 gap-3">
        {TOOLS.map((t) => (
          <Link key={t.title} to={t.to} className="rounded-2xl bg-surface p-4 text-center shadow-sm no-underline">
            <div className="text-2xl">{t.icon}</div>
            <div className="mt-1.5 text-sm font-semibold text-fg">{t.title}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
