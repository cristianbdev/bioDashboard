import { Info } from "lucide-react";

export function InfoTitle({ title, info }: { title: string; info?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-base font-semibold text-[#1F2A2A]">{title}</span>
      {info && (
        <span
          className="info-tooltip inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#E2E8E5] bg-white text-[10px] font-semibold text-[#6B7C72]"
          tabIndex={0}
        >
          <Info className="h-3 w-3" />
          <span className="info-bubble">{info}</span>
        </span>
      )}
    </div>
  );
}
