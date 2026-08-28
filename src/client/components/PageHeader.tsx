import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "./icons";
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
    /* Mobile: banner xanh bo tron kieu app. Desktop (>=lg): header phang tren
       nen trang, vi mang mau lon giua man hinh rong trong rat "mobile". */
    <header className="rounded-b-3xl bg-primary-hover px-5 pb-7 pt-5 text-white sm:px-9 sm:pb-10 sm:pt-8 lg:rounded-none lg:border-b lg:border-border lg:bg-transparent lg:px-8 lg:pb-5 lg:pt-7 lg:text-fg">
      <Link
        to={backTo}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/85 no-underline lg:mb-2 lg:text-fg-muted lg:hover:text-primary"
      >
        <ArrowLeftIcon size={16} />
        {resolvedBackLabel}
      </Link>
      <h1 className="m-0 text-[22px] font-extrabold sm:text-3xl lg:text-2xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-white/75 sm:text-base lg:text-fg-muted">{subtitle}</p>}
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
