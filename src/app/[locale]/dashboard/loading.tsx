import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 bg-[var(--color-surface-base)] px-6 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand)]" aria-hidden />
      </div>
      <div className="space-y-2 text-center">
        <div className="mx-auto h-3 w-40 animate-pulse rounded-full bg-[var(--color-border-subtle)]" />
        <div className="mx-auto h-3 w-28 animate-pulse rounded-full bg-[var(--color-border-subtle)]/70" />
      </div>
    </div>
  );
}
