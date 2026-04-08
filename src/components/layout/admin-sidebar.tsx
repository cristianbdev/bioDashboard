"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  Database,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DashboardTab } from "@/lib/access-control";
import { cn } from "@/lib/utils";

type AdminSidebarProps = {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  isOpen: boolean;
  onClose: () => void;
  t: (key: string) => string;
};

type NavItem = { id: DashboardTab; icon: typeof BarChart3; labelKey: string };

type NavGroup = {
  labelKey: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: "navigation.groupMain",
    items: [
      { id: "overview", icon: BarChart3, labelKey: "tabs.overview" },
      { id: "facilities", icon: Building2, labelKey: "tabs.facilities" },
    ],
  },
  {
    labelKey: "navigation.groupAnalysis",
    items: [
      { id: "comparative", icon: Activity, labelKey: "tabs.comparative" },
      { id: "methodology", icon: Database, labelKey: "tabs.methodology" },
    ],
  },
  {
    labelKey: "navigation.groupAdmin",
    items: [{ id: "users", icon: Users, labelKey: "tabs.users" }],
  },
];

const STORAGE_KEY = "bio-dashboard-sidebar-collapsed";
const FOCUSABLE_SELECTOR =
  "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])";

const HEADER_HEIGHT = "4rem"; // 64px - ajustable según la altura real del header

export function AdminSidebar({ activeTab, onTabChange, isOpen, onClose, t }: AdminSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;

    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });
  const mobileDrawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Save collapsed state
  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, String(next));
  };

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const frameId = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = mobileDrawerRef.current
        ? Array.from(mobileDrawerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedRef.current?.focus();
    };
  }, [isOpen, onClose]);

  function renderNavButton(item: NavItem) {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onTabChange(item.id);
          onClose();
        }}
        aria-current={isActive ? "page" : undefined}
        title={isCollapsed ? t(item.labelKey) : undefined}
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand) focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          isActive
            ? "bg-(--color-brand) text-white shadow-sm"
            : "text-(--color-text-secondary) hover:bg-(--color-surface-base) hover:text-(--color-brand)",
          isCollapsed && "md:justify-center md:px-2.5",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className={cn("truncate transition-opacity", isCollapsed ? "md:sr-only" : "md:opacity-100")}>{t(item.labelKey)}</span>
      </button>
    );
  }

  function renderGroup(group: NavGroup) {
    return (
      <section key={group.labelKey} className="space-y-2">
        <p className={cn("px-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-(--color-text-muted)", isCollapsed && "md:sr-only")}>
          {t(group.labelKey)}
        </p>
        <div className="space-y-1">{group.items.map((item) => renderNavButton(item))}</div>
      </section>
    );
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[55] bg-black/40 md:hidden"
          onClick={onClose}
          aria-label={t("navigation.closeMenu")}
        />
      ) : null}

      {isOpen ? (
      <aside
          ref={mobileDrawerRef}
          className={cn(
            "fixed inset-y-0 left-0 z-[60] flex w-[min(88vw,320px)] flex-col border-r border-(--color-border-subtle) bg-white shadow-2xl md:hidden",
            "animate-in slide-in-from-left-4 duration-300",
          )}
          role="dialog"
          aria-modal="true"
          aria-label={t("navigation.title")}
        >
          <div className="flex items-start justify-between gap-3 border-b border-(--color-border-subtle) px-5 py-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-(--color-text-primary)">{t("navigation.title")}</p>
              <p className="truncate text-xs text-(--color-text-secondary)">{t("header.title")}</p>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-(--color-text-secondary) transition-colors hover:bg-(--color-surface-base) hover:text-(--color-text-primary) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand) focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              aria-label={t("navigation.closeMenu")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group) => renderGroup(group))}
          </nav>
        </aside>
      ) : null}

      <aside
        className={cn(
          "hidden md:flex md:flex-col md:shrink-0 md:sticky md:z-40 md:h-[calc(100vh-4rem)] md:top-16",
          "md:border-r md:border-(--color-border-subtle) md:bg-white md:shadow-none",
          isCollapsed ? "md:w-22" : "md:w-70",
        )}
        aria-label={t("navigation.title")}
      >
        <div className="border-b border-(--color-border-subtle) px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className={cn("min-w-0", isCollapsed && "md:sr-only")}>
              <p className="text-sm font-semibold text-(--color-text-primary)">{t("navigation.title")}</p>
              <p className="truncate text-xs text-(--color-text-secondary)">{t("header.title")}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleCollapsed}
              className={cn(
                "h-10 w-10 shrink-0 justify-center rounded-lg text-(--color-text-secondary) transition-colors hover:bg-(--color-surface-base) hover:text-(--color-text-primary)",
                isCollapsed && "md:mx-auto",
              )}
              aria-label={isCollapsed ? t("navigation.expandSidebar") : t("navigation.collapse")}
            >
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        <nav className={cn("flex-1 space-y-5 px-3 py-4 overflow-y-auto", isCollapsed && "md:px-2")}>{NAV_GROUPS.map((group) => renderGroup(group))}</nav>

        <div className="border-t border-(--color-border-subtle) px-4 py-3">
          <div className={cn("flex items-center gap-2 text-xs text-(--color-text-secondary)", isCollapsed && "md:justify-center")}>
              <span className="h-2 w-2 rounded-full bg-(--color-brand)" />
            <span className={cn("truncate", isCollapsed && "md:sr-only")}>{t("header.subtitle")}</span>
          </div>
        </div>
      </aside>
    </>
  );
}
