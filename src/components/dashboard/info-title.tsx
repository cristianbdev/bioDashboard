import { Info } from "lucide-react";

export function InfoTitle({ title, info }: { title: string; info?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
      {info && (
        <span
          className="info-tooltip inline-flex h-6 w-6 cursor-help items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[10px] font-semibold text-[var(--color-text-secondary)] transition-colors duration-200 hover:bg-[var(--color-brand)]/10 hover:text-[var(--color-brand)]"
          tabIndex={0}
          aria-label="More information"
        >
          <Info className="h-4 w-4" />
          <span className="info-bubble">{info}</span>
        </span>
      )}
    </div>
  );
}
