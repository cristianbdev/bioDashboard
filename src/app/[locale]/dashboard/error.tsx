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
    <div className="flex min-h-[50vh] items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-lg space-y-4 rounded-2xl border border-destructive/20 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-5 w-5" aria-hidden />
          <h2 className="text-base font-semibold text-foreground">{t("errors.title")}</h2>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("errors.unexpected")}</p>
        <Button type="button" variant="outline" onClick={reset} className="border-border">
          {t("actions.refresh")}
        </Button>
      </div>
    </div>
  );
}
