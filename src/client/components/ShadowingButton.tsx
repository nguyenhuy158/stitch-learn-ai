import { useEffect, useRef, useState } from "react";
import { MicIcon } from "./icons";
import { listenOnce, speechInputSupported } from "../lib/speechInput";
import { diffWords, type DiffWord } from "../lib/wordDiff";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";

/**
 * Luyen shadowing: bam mic, doc lai cau, app cham tung tu.
 * Chi hien tren browser co SpeechRecognition.
 */
export function ShadowingButton({ text }: { text: string }) {
  const { t } = useLanguage();
  const [listening, setListening] = useState(false);
  const [result, setResult] = useState<{ words: DiffWord[]; score: number } | null>(null);
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => () => stopRef.current?.(), []);
  // Cau doi (vd sang bai khac) thi ket qua cu khong con dung nua.
  useEffect(() => setResult(null), [text]);

  if (!speechInputSupported()) return null;

  function toggle() {
    if (listening) return stopRef.current?.();
    setResult(null);
    setListening(true);
    stopRef.current = listenOnce(
      (transcript) => setResult(diffWords(text, transcript)),
      () => setListening(false)
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        title={t("shadow.button")}
        aria-label={t("shadow.button")}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-ui border transition",
          "outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
          listening
            ? "animate-pulse border-danger bg-danger-soft text-danger"
            : "border-border bg-surface text-fg-muted hover:text-primary"
        )}
      >
        <MicIcon size={18} />
      </button>
      {result && (
        <div className="w-full rounded-ui bg-surface-muted p-3 text-sm leading-relaxed" role="status">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-primary-hover">{t("shadow.result")}</span>
            <span className={cn("text-xs font-bold", result.score >= 80 ? "text-primary" : "text-danger")}>
              {result.score}%
            </span>
          </div>
          {result.words.map((w, i) => (
            <span key={i} className={w.ok ? "text-primary" : "font-semibold text-danger underline decoration-wavy"}>
              {w.word}{" "}
            </span>
          ))}
        </div>
      )}
    </>
  );
}
