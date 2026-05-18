import { Info } from "lucide-react";

export function InfoTitle({ title, info }: { title: string; info?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold text-[var(--color-text-primary)]">{title}</span>
      {info && (
        <span
          className="info-tooltip inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-raised)] text-[10px] font-semibold text-[var(--color-text-secondary)]"
          tabIndex={0}
        >
          <Info className="h-3 w-3" />
          <span className="info-bubble">{info}</span>
        </span>
      )}
    </div>
  );
}
