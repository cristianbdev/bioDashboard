"use client";

import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const THEME_OPTIONS = [
  { value: "light", icon: Sun },
  { value: "dark", icon: Moon },
  { value: "system", icon: Monitor },
] as const;

type ThemeValue = (typeof THEME_OPTIONS)[number]["value"];

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("theme");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get current icon based on resolved theme (for display when system)
  const CurrentIcon =
    THEME_OPTIONS.find((opt) => opt.value === (theme === "system" ? resolvedTheme : theme))?.icon ||
    Sun;

  // Show neutral icon during SSR and before client mount to avoid hydration mismatch
  const DisplayIcon = mounted ? CurrentIcon : Monitor;

  return (mounted ? (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 w-11 p-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)] sm:h-8 sm:w-8"
          aria-label={t("toggle")}
        >
          <DisplayIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4}>
        {THEME_OPTIONS.map(({ value, icon: Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
              theme === value && "bg-accent text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{t(value)}</span>
            {theme === value && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      className="h-11 w-11 p-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)] sm:h-8 sm:w-8"
      aria-label={t("toggle")}
    >
      <Monitor className="h-4 w-4" />
    </Button>
  ));
}
