"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Clock, Languages, Loader2, Menu, RefreshCw, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocaleContext } from "@/context/LocaleContext";
import { type AppRole } from "@/lib/access-control";
import { supportedLocales, type Locale, t as translate } from "@/lib/i18n";
import type { DashboardData } from "@/lib/kobo";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  role: AppRole;
  data?: DashboardData | null;
  isLoaded: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenNav?: () => void;
};

const ROLE_BADGE_STYLE: Record<AppRole, string> = {
  admin: "border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 text-[var(--color-brand)]",
  producer: "border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  public: "border-[var(--color-muted)]/30 bg-[var(--color-muted)]/10 text-[var(--color-muted)]",
};

export function AppHeader({ role, data, isLoaded, onRefresh, isLoading, onOpenNav }: AppHeaderProps) {
  const { locale, setLocale } = useLocaleContext();
  const t = (key: string) => translate(locale, key);

  const formattedUpdatedAt = (() => {
    if (!data?.stats.lastUpdated) return "-";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(data.stats.lastUpdated));
  })();

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border-subtle)] bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        {/* Left: Logo + Title + Badge */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand)] shadow-sm">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-base font-semibold leading-tight text-[var(--color-text-primary)]">
              {t("header.title")}
            </p>
            <p className="truncate text-xs text-[var(--color-text-secondary)]">
              {t("header.subtitle")}
            </p>
          </div>
          <Badge variant="outline" className={cn("shrink-0 text-xs font-medium", ROLE_BADGE_STYLE[role])}>
            {t(`role.${role}`)}
          </Badge>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Last updated - desktop only */}
          <div className="hidden items-center gap-1.5 text-xs text-[var(--color-text-muted)] lg:flex">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedUpdatedAt}</span>
          </div>

          {/* Language selector */}
          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger
              className="h-8 w-auto min-w-[60px] border-0 bg-transparent text-xs font-medium text-[var(--color-text-secondary)] shadow-none hover:bg-[var(--color-surface-base)]"
            >
              <div className="flex items-center gap-1">
                <Languages className="h-3.5 w-3.5" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {supportedLocales.map((entry) => (
                <SelectItem key={entry} value={entry} className="uppercase">
                  {entry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Refresh */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]"
            aria-label={t("actions.refresh")}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>

          {/* Sign in - ghost, no fill */}
          {isLoaded ? (
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button size="sm" variant="ghost" className="h-8 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)]">
                  {t("auth.signIn")}
                </Button>
              </SignInButton>
            </Show>
          ) : null}

          {/* User button */}
          {isLoaded ? (
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8" },
                }}
              />
            </Show>
          ) : null}

          {/* Mobile nav hamburger - only admin & producer */}
          {role !== "public" && onOpenNav && (
            <Button
              type="button"
              variant="ghost"
              onClick={onOpenNav}
              className="flex h-8 w-8 items-center justify-center rounded-lg p-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-brand)] lg:hidden"
              aria-label={t("navigation.openMenu")}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
