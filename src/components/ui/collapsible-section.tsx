"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({ title, icon, defaultOpen = false, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-raised)] overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-base)]"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-dashboard-section">{title}</h3>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-[var(--color-text-secondary)] transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      <div className={cn("transition-all duration-300", isOpen ? "block" : "hidden")}>
        <div className="border-t border-[var(--color-border-subtle)] p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
