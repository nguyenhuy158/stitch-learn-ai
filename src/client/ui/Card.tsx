import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

const TONE = {
  surface: "border border-border bg-surface text-fg",
  primary: "bg-primary-hover text-white",
  muted: "border border-border bg-surface-muted text-fg",
} as const;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Bo dem san ben trong. Tat khi con la danh sach tu ke vien. */
  padded?: boolean;
  /** Mau nen: surface (mac dinh), primary (panel noi bat), muted (nen mo). */
  tone?: keyof typeof TONE;
};

export function Card({ padded = true, tone = "surface", className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn("rounded-ui shadow-sm", TONE[tone], padded && "p-4", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export type CardHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Nut hoac menu ben phai tieu de. */
  action?: ReactNode;
  className?: string;
};

export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-fg">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-fg-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** O so lieu: nhan nho o tren, con so lon o duoi. */
export function Metric({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="rounded-ui border border-border bg-surface p-3 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
      <p className="mt-2 text-base font-semibold leading-tight text-fg tabular sm:text-lg">
        {value}
      </p>
    </div>
  );
}
