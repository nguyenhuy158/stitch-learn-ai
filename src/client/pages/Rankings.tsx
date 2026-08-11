import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, isUnauthorized } from "../lib/api";
import { PageHeader, PageState } from "../components/PageHeader";
import { Spinner } from "../ui/Spinner";
import { cn } from "../ui/cn";

type RankUser = { id: number; name?: string; streak?: number; xp?: number };

export default function Rankings() {
  const navigate = useNavigate();
  const [top, setTop] = useState<RankUser[] | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myId, setMyId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [me, rank] = await Promise.all([api.me(), api.rankings()]);
        setMyId(me.user?.id ?? null);
        setTop(rank.top || []);
        setMyRank(rank.myRank ?? null);
      } catch (err: any) {
        if (isUnauthorized(err)) return navigate("/login");
        setError("Không tải được xếp hạng: " + err.message);
      }
    })();
  }, [navigate]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backTo="/" title="Xếp hạng theo XP" />
      <main className="p-5 sm:p-9">
        {error && <PageState tone="error">{error}</PageState>}
        {!error && top === null && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}
        {!error && top && (
          <>
            {myRank && !top.some((u) => u.id === myId) && (
              <div className="mb-5 rounded-ui p-3.5 text-center font-bold text-white" style={{ background: "var(--teal-dark)" }}>
                Hạng của bạn: #{myRank}
              </div>
            )}
            <div className="flex flex-col gap-2">
              {top.map((u, i) => (
                <div
                  key={u.id}
                  className={cn(
                    "flex items-center gap-3 rounded-ui bg-surface p-3 shadow-sm",
                    u.id === myId && "border-2 border-primary"
                  )}
                >
                  <div className="w-7 text-center font-extrabold" style={{ color: "var(--teal-dark)" }}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 font-semibold">
                    {u.name || "Ẩn danh"}
                    {u.id === myId ? " (Bạn)" : ""}
                    <div className="text-xs text-fg-muted">Chuỗi {u.streak || 0} ngày</div>
                  </div>
                  <div className="font-bold text-accent">{u.xp || 0} XP</div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
