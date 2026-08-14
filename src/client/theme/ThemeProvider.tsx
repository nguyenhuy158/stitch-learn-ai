import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/** Mau nhan dien (accent). Moi accent co ca ban sang va ban toi, xem ThemeMode. */
export type AppTheme = "teal" | "ocean" | "sunset" | "lavender";
/** Sang/toi, doc lap voi accent — chon "ocean" van co the xem ban dark. */
export type ThemeMode = "light" | "dark";

const THEMES: { id: AppTheme; label: string; swatch: string }[] = [
  { id: "lavender", label: "Lavender (AI-Native)", swatch: "#7c3aed" },
  { id: "teal", label: "Teal (mặc định)", swatch: "#0f766e" },
  { id: "ocean", label: "Ocean", swatch: "#216d94" },
  { id: "sunset", label: "Sunset", swatch: "#a64f36" },
];

const THEME_KEY = "app_theme";
const MODE_KEY = "app_mode";

type ThemeCtx = {
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  themes: typeof THEMES;
};

const Ctx = createContext<ThemeCtx | null>(null);

function readInitialTheme(): AppTheme {
  if (typeof window === "undefined") return "lavender";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored && THEMES.some((t) => t.id === stored)) return stored as AppTheme;
  return "lavender";
}

function readInitialMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(MODE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  // Bundle cu luu theme="dark" nhu 1 accent rieng — coi day la tin hieu muon dark mode.
  if (window.localStorage.getItem(THEME_KEY) === "dark") return "dark";
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function applyTheme(theme: AppTheme, mode: ThemeMode) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", mode === "dark");
  root.classList.toggle("light", mode === "light");
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>(readInitialTheme);
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode);

  useEffect(() => {
    applyTheme(theme, mode);
    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(MODE_KEY, mode);
  }, [theme, mode]);

  const setTheme = (t: AppTheme) => setThemeState(t);
  const setMode = (m: ThemeMode) => setModeState(m);

  const value = useMemo(
    () => ({ theme, setTheme, mode, setMode, themes: THEMES }),
    [theme, mode]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
