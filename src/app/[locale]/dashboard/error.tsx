"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: Props) {
  const t = useTranslations();

  useEffect(() => {
    console.error("Dashboard error boundary", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[var(--color-surface-base)] px-6 py-16">
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-[var(--color-danger)]/20 bg-[var(--color-raised)] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-[var(--color-danger)]">
          <AlertCircle className="h-5 w-5" aria-hidden />
          <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{t("errors.title")}</h2>
        </div>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{t("errors.unexpected")}</p>
        <Button type="button" variant="outline" onClick={reset} className="border-[var(--color-border-subtle)]">
          {t("actions.refresh")}
        </Button>
      </div>
    </div>
  );
}
