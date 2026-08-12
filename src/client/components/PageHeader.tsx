import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageProvider";

/** Rounded primary-tone header used by every page (back link + title + optional subtitle). */
export function PageHeader({
  backTo,
  backLabel,
  title,
  subtitle,
}: {
  backTo: string;
  backLabel?: string;
  title: string;
  subtitle?: ReactNode;
}) {
  const { t } = useLanguage();
  const resolvedBackLabel = backLabel ?? t("common.backHome");
  return (
    <header className="rounded-b-3xl bg-primary-hover px-5 pb-7 pt-5 text-white sm:px-9 sm:pb-10 sm:pt-8">
      <Link to={backTo} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 no-underline">
        ← {resolvedBackLabel}
      </Link>
      <h1 className="m-0 text-[22px] font-extrabold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-white/75 sm:text-base">{subtitle}</p>}
    </header>
  );
}

export function PageState({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "error" }) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className={"px-5 py-16 text-center text-sm " + (tone === "error" ? "text-danger" : "text-fg-muted")}
    >
      {children}
    </div>
  );
}
