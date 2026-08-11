import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type AppTheme = "teal" | "ocean" | "sunset" | "dark";

const THEMES: { id: AppTheme; label: string; swatch: string }[] = [
  { id: "teal", label: "Teal (mặc định)", swatch: "#0f766e" },
  { id: "ocean", label: "Ocean", swatch: "#216d94" },
  { id: "sunset", label: "Sunset", swatch: "#a64f36" },
  { id: "dark", label: "Dark", swatch: "#14b8a6" },
];

const STORAGE_KEY = "app_theme";

type ThemeCtx = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  themes: typeof THEMES;
};

const Ctx = createContext<ThemeCtx | null>(null);

function readInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "teal";
  const stored = window.localStorage.getItem(STORAGE_KEY) as AppTheme | null;
  if (stored && THEMES.some((t) => t.id === stored)) return stored;
  return "teal";
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  root.classList.toggle("light", !isDark);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (t: AppTheme) => setThemeState(t);

  const value = useMemo(() => ({ theme, setTheme, themes: THEMES }), [theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
