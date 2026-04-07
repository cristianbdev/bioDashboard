"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardTab } from "@/lib/access-control";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  t: (key: string) => string;
};

const NAV_ITEMS: Array<{ id: DashboardTab; icon: typeof BarChart3; labelKey: string }> = [
  { id: "overview", icon: BarChart3, labelKey: "tabs.overview" },
  { id: "facilities", icon: Building2, labelKey: "tabs.facilities" },
  { id: "comparative", icon: Activity, labelKey: "tabs.comparative" },
  { id: "methodology", icon: Database, labelKey: "tabs.methodology" },
  { id: "users", icon: Users, labelKey: "tabs.users" },
];

const STORAGE_KEY = "bio-dashboard-sidebar-collapsed";

export function AdminSidebar({ activeTab, onTabChange, isOpen, onClose, t }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Load collapsed state from sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored !== null) setIsCollapsed(stored === "true");
    }
  }, []);

  // Save collapsed state
  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, String(next));
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", onKey);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--color-border-subtle)] bg-white shadow-xl transition-all duration-300",
          "md:sticky md:top-16 md:z-30 md:h-[calc(100vh-4rem)] md:shadow-none",
          // Mobile
          isOpen ? "w-[280px] translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop collapse
          isCollapsed ? "md:w-[72px]" : "md:w-[260px]",
        )}
        aria-label="Admin navigation"
      >
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-5 py-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Navigation</p>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>
        </div>

        {/* Nav items */}
        <nav className={cn("flex-1 space-y-1 px-3 py-4", isCollapsed && "md:space-y-1 md:px-2 md:py-4")}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                type="button"
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--color-brand)] text-white shadow-sm"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-brand)]",
                  isCollapsed && "md:justify-center md:px-2.5",
                )}
                title={isCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className={cn("truncate transition-opacity", isCollapsed ? "md:hidden" : "md:opacity-100")}>
                  {t(item.labelKey)}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden border-t border-[var(--color-border-subtle)] p-3 md:block">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              "h-9 w-full justify-center gap-2 rounded-lg text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)]",
              isCollapsed && "px-2",
            )}
            aria-label={isCollapsed ? "Expand" : "Collapse"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-3.5 w-3.5" />
            ) : (
              <>
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>{t("navigation.collapse")}</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
