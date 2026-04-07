"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
};

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center md:hidden"
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-lg rounded-t-2xl bg-white shadow-xl",
          "max-h-[85vh] overflow-y-auto",
          "animate-in slide-in-from-bottom-full duration-300",
        )}
      >
        {/* Handle */}
        <div className="flex items-center justify-center py-3">
          <div className="h-1 w-12 rounded-full bg-[var(--color-border-subtle)]" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 pb-3">
          {title ? (
            <p id={titleId} className="font-semibold text-[var(--color-text-primary)]">{title}</p>
          ) : (
            <div />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-11 w-11 -mr-2 text-[var(--color-text-secondary)] sm:h-8 sm:w-8"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
