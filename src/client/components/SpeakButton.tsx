import { SpeakerIcon } from "./icons";
import { speak } from "../lib/speak";
import { cn } from "../ui/cn";
import { useLanguage } from "../i18n/LanguageProvider";

/* Every size stays at or above the 44px touch target, so the button is tappable
   on a phone even where the surrounding layout wants a small control. */
const SIZE = {
  sm: { box: "h-11 w-11 rounded-ui", icon: 18 },
  md: { box: "h-12 w-12 rounded-full", icon: 22 },
  lg: { box: "h-16 w-16 rounded-full", icon: 30 },
} as const;

/** Reads an English word aloud. One component so every page gets the same icon, label and hit area. */
export function SpeakButton({
  text,
  size = "md",
  label,
  className,
  audioUrl,
}: {
  text: string;
  size?: keyof typeof SIZE;
  label?: string;
  className?: string;
  /** mp3 doc tu that (dictionaryapi.dev); loi thi rot ve speechSynthesis. */
  audioUrl?: string;
}) {
  const { t } = useLanguage();
  const accessibleLabel = label ?? t("audio.speak");
  const { box, icon } = SIZE[size];
  return (
    <button
      type="button"
      onClick={() => (audioUrl ? new Audio(audioUrl).play().catch(() => speak(text)) : speak(text))}
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary-hover text-white shadow-sm transition",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "hover:brightness-110 active:scale-95",
        box,
        className,
      )}
    >
      <SpeakerIcon size={icon} />
    </button>
  );
}
