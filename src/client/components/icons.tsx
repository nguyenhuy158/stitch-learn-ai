/* Tiny inline icon set (no external icon lib dependency). */
import type { ReactNode, SVGProps } from "react";

type IconProps = { size?: number } & SVGProps<SVGSVGElement>;

function base({ size = 20, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></> });
}
export function BookIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5v-13Z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" /></> });
}
export function ChatIcon(props: IconProps) {
  return base({ ...props, children: <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10Z" /> });
}
export function HistoryIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M3 3v5h5" /><path d="M3.05 13a9 9 0 1 0 2.13-6.36L3 8" /><path d="M12 7v5l4 2" /></> });
}
export function UserIcon(props: IconProps) {
  return base({ ...props, children: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></> });
}
export function CheckIcon(props: IconProps) {
  return base({ ...props, children: <path d="M20 6 9 17l-5-5" /> });
}
export function LockIcon(props: IconProps) {
  return base({ ...props, children: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></> });
}
export function SendIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></> });
}
export function TutorIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></> });
}
export function CardsIcon(props: IconProps) {
  return base({ ...props, children: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18" /></> });
}
export function TargetIcon(props: IconProps) {
  return base({ ...props, children: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></> });
}
export function MistakeIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></> });
}
export function GameIcon(props: IconProps) {
  return base({ ...props, children: <><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 12h4M8 10v4M15 11h.01M18 13h.01" /></> });
}
export function SpeakerIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M11 5L6 9H2v6h4l5 4V5z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" /></> });
}
export function PuzzleIcon(props: IconProps) {
  return base({ ...props, children: <path d="M20 12h2M2 12h2M12 2v2M12 20v2M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" /> });
}
export function KeyboardIcon(props: IconProps) {
  return base({ ...props, children: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01" /><path d="M18 8h.01M6 12h.01M10 12h.01M14 12h.01" /><path d="M18 12h.01M7 16h10" /></> });
}
export function RainIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M20 16.2A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25" /><path d="M8 19v2M12 21v2M16 19v2" /></> });
}
export function MedalIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.11" /><circle cx="12" cy="8" r="6" /></> });
}
export function TrophyIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16M10 14.66V17h4v-2.34" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2z" /></> });
}
export function ImageIcon(props: IconProps) {
  return base({ ...props, children: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></> });
}
export function AlphabetIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M3 12h18M3 6h18M3 18h18" /><path d="M5 4v16M12 4v16M19 4v16" /></> });
}
export function SearchIcon(props: IconProps) {
  return base({ ...props, children: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></> });
}
export function StarIcon(props: IconProps) {
  return base({ ...props, children: <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /> });
}
export function TrashIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M10 11v6M14 11v6" /></> });
}
export function PlusIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M12 5v14M5 12h14" /></> });
}
export function SettingsIcon(props: IconProps) {
  return base({ ...props, children: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></> });
}
export function TranslateIcon(props: IconProps) {
  return base({ ...props, children: <><path d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6" /></> });
}
