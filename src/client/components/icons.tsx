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
export function StarIcon(props: IconProps) {
  return base({ ...props, children: <path d="M12 2l3 7h7l-5.5 4.5L18.5 21 12 16.5 5.5 21 7.5 13.5 2 9h7z" /> });
}
export function SendIcon(props: IconProps) {
  return base({ ...props, children: <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4 20-7Z" /></> });
}
