"use client";

import { Info } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function InfoTitle({ title, info }: { title: string; info?: string }) {
  const t = useTranslations();

  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
      {info && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[10px] font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)] focus-visible:ring-offset-2"
              aria-label={t("info.moreInformation")}
            >
              <Info className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={6} className="max-w-[260px]">
            <p className="text-xs leading-relaxed">{info}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
