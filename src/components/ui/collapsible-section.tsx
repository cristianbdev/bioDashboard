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
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-background"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-dashboard-section">{title}</h3>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      {isOpen ? (
        <div className="border-t border-border p-4 sm:p-5">
          {children}
        </div>
      ) : null}
    </div>
  );
}
