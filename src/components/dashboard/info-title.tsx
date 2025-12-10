import { Info } from "lucide-react";

export function InfoTitle({ title, info }: { title: string; info?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold">{title}</span>
      {info && (
        <span className="info-tooltip inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200" tabIndex={0}>
          <Info className="h-3 w-3" />
          <span className="info-bubble">{info}</span>
        </span>
      )}
    </div>
  );
}
