import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../ui/BottomNav";
import { HomeIcon, BookIcon, ChatIcon, HistoryIcon, UserIcon } from "./icons";
import { useLanguage } from "../i18n/LanguageProvider";

const NAV_ITEMS_BASE = [
  { id: "/", key: "nav.home", icon: HomeIcon },
  { id: "/lessons", key: "nav.learn", icon: BookIcon },
  { id: "/chat", key: "nav.chat", icon: ChatIcon },
  { id: "/history", key: "nav.history", icon: HistoryIcon },
  { id: "/profile", key: "nav.profile", icon: UserIcon },
] as const;

/** 5-tab bottom nav (mobile) / left sidebar (desktop >=1024px), per the old bundle shell. */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const NAV_ITEMS = NAV_ITEMS_BASE.map((item) => ({ ...item, label: t(item.key) }));
  const active = NAV_ITEMS.find((i) => i.id === location.pathname)?.id ?? "/";

  return (
    <div className="min-h-dvh bg-bg text-fg lg:flex">
      <aside className="hidden w-60 flex-col border-r border-border bg-surface p-4 lg:flex">
        <div className="mb-6 px-2 text-lg font-extrabold text-primary">AI English</div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === active;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={
                  "flex items-center gap-3 rounded-ui px-3 py-2.5 text-left text-sm font-medium transition " +
                  (isActive ? "bg-primary-soft text-primary" : "text-fg-muted hover:bg-surface-muted")
                }
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 pb-16 lg:pb-0">{children}</div>

      <BottomNav items={NAV_ITEMS as any} active={active} onChange={(id) => navigate(id)} />
    </div>
  );
}
