import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translations } from "./translations";

export type Lang = "vi" | "en";

const LANG_KEY = "app_lang";

type LanguageCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const Ctx = createContext<LanguageCtx | null>(null);

function readInitialLang(): Lang {
  if (typeof window === "undefined") return "vi";
  const stored = window.localStorage.getItem(LANG_KEY);
  if (stored === "vi" || stored === "en") return stored;
  return "vi";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    window.localStorage.setItem(LANG_KEY, lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>) => {
      const entry = (translations as Record<string, { vi: string; en: string } | undefined>)[key];
      let text = entry ? entry[lang] ?? entry.vi ?? key : key;
      if (params) {
        for (const [name, value] of Object.entries(params)) {
          text = text.replace(`{${name}}`, String(value));
        }
      }
      return text;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLanguage() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
