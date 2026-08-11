import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { cn } from "../ui/cn";

/** Small popover with 4 color swatches, matching the old bundle's "Giao diện" row behavior. */
export function ThemePicker() {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const current = themes.find((t) => t.id === theme);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-ui px-2 py-1 text-sm font-medium text-fg-muted hover:bg-surface-muted"
      >
        <span
          className="h-4 w-4 rounded-full border border-border"
          style={{ background: current?.swatch }}
        />
        {current?.label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-ui border border-border bg-surface p-2 shadow-lg">
            {themes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-ui px-2 py-2 text-left text-sm hover:bg-surface-muted",
                  t.id === theme && "bg-primary-soft"
                )}
              >
                <span className="h-4 w-4 rounded-full border border-border" style={{ background: t.swatch }} />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
