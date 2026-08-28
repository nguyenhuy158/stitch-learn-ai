import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "../ui/BottomNav";
import { HomeIcon, BookIcon, ChatIcon, HistoryIcon, UserIcon } from "./icons";
import { TOOL_TABS, TOOL_KEYS } from "../lib/navItems";
import { useLanguage } from "../i18n/LanguageProvider";

const NAV_ITEMS_BASE = [
  { id: "/", key: "nav.home", icon: HomeIcon },
  { id: "/lessons", key: "nav.learn", icon: BookIcon },
  { id: "/chat", key: "nav.chat", icon: ChatIcon },
  { id: "/history", key: "nav.history", icon: HistoryIcon },
  { id: "/profile", key: "nav.profile", icon: UserIcon },
] as const;

/**
 * Bottom nav 5 tab tren mobile; tren desktop la sidebar day du (5 tab chinh +
 * toan bo cong cu/tro choi) de khong phai quay ve trang chu moi doi duoc man hinh.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const NAV_ITEMS = NAV_ITEMS_BASE.map((item) => ({ ...item, label: t(item.key) }));
  const path = location.pathname;
  const bottomActive = NAV_ITEMS.find((i) => i.id === path)?.id ?? "/";

  const linkClass = (isActive: boolean) =>
    "flex w-full items-center gap-3 rounded-ui px-3 py-2 text-left text-sm font-medium outline-none transition " +
    "focus-visible:ring-2 focus-visible:ring-ring " +
    (isActive ? "bg-primary-soft text-primary" : "text-fg-muted hover:bg-surface-muted hover:text-fg");

  return (
    <div className="min-h-dvh bg-bg text-fg lg:flex">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface p-4 lg:flex">
        <div className="mb-5 px-2 text-lg font-extrabold text-primary">AI English</div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" onClick={() => navigate(item.id)} className={linkClass(item.id === path)}>
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {TOOL_TABS.map((tab) => (
          <div key={tab} className="mt-5">
            <div className="mb-1 px-3 text-[11px] font-bold uppercase tracking-wide text-fg-muted">
              {t(`home.toolTab.${tab}`)}
            </div>
            <nav className="flex flex-col gap-0.5">
              {TOOL_KEYS.filter((tool) => tool.tab === tab).map((tool) => {
                const Icon = tool.icon;
                return (
                  <button key={tool.to} type="button" onClick={() => navigate(tool.to)} className={linkClass(tool.to === path)}>
                    <Icon size={18} />
                    {t(`home.tool.${tool.key}`)}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </aside>

      <div className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</div>

      <div className="lg:hidden">
        <BottomNav items={NAV_ITEMS as any} active={bottomActive} onChange={(id) => navigate(id)} />
      </div>
    </div>
  );
}
