import { PageHeader } from "../components/PageHeader";
import { Card } from "../ui/Card";
import { cn } from "../ui/cn";
import { useTheme } from "../theme/ThemeProvider";

export default function Appearance() {
  const { theme, setTheme, mode, setMode, themes } = useTheme();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader backTo="/profile" title="Giao diện" />
      <main className="p-5 sm:p-9">
        <div className="mb-2 text-sm font-bold text-fg-muted">Chế độ sáng / tối</div>
        <Card padded={false} className="mb-6 divide-y divide-border overflow-hidden">
          {(
            [
              { id: "light" as const, label: "Sáng", desc: "Nền sáng, chữ tối." },
              { id: "dark" as const, label: "Tối", desc: "Nền tối, đỡ chói mắt ban đêm." },
            ]
          ).map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className="flex w-full items-center justify-between gap-3 p-4 text-left"
            >
              <div>
                <div className="text-sm font-semibold">{m.label}</div>
                <div className="text-xs text-fg-muted">{m.desc}</div>
              </div>
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-primary",
                  mode === m.id && "bg-primary"
                )}
              >
                {mode === m.id && <span className="h-2 w-2 rounded-full bg-primary-fg" />}
              </span>
            </button>
          ))}
        </Card>

        <div className="mb-2 text-sm font-bold text-fg-muted">Màu chủ đạo</div>
        <Card padded={false} className="divide-y divide-border overflow-hidden">
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              className="flex w-full items-center gap-3 p-4 text-left"
            >
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-border"
                style={{ background: t.swatch }}
              />
              <span className="flex-1 text-sm font-semibold">{t.label}</span>
              {theme === t.id && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                  <span className="h-2 w-2 rounded-full bg-primary-fg" />
                </span>
              )}
            </button>
          ))}
        </Card>
      </main>
    </div>
  );
}
