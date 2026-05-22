"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", icon: Sun, labelKey: "theme.light" as const },
  { value: "dark", icon: Moon, labelKey: "theme.dark" as const },
  { value: "system", icon: Monitor, labelKey: "theme.system" as const },
] as const;

type ThemeToggleProps = {
  className?: string;
  variant?: "icon" | "menu-item";
};

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const t = useTranslations();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const activeValue = theme === "system" ? resolvedTheme : theme;
  const CurrentIcon =
    THEME_OPTIONS.find((opt) => opt.value === (mounted ? activeValue : "light"))?.icon ?? Monitor;

  if (variant === "menu-item") {
    return (
      <div className={cn("border-t border-[var(--color-border-subtle)] pt-1", className)}>
        <p className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]">{t("theme.toggle")}</p>
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = mounted && theme === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                isActive && "bg-accent text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{t(opt.labelKey)}</span>
              {isActive ? <span className="ml-auto">✓</span> : null}
            </DropdownMenuItem>
          );
        })}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-11 min-h-11 w-11 min-w-11 p-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)]",
            className,
          )}
          aria-label={t("theme.toggle")}
        >
          <CurrentIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className="w-40">
        {THEME_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = mounted && theme === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={cn("flex cursor-pointer items-center gap-2", isActive && "bg-accent text-accent-foreground")}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{t(opt.labelKey)}</span>
              {isActive ? <span className="ml-auto text-xs">✓</span> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
