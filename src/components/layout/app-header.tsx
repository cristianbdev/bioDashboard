"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import {
  Clock,
  Languages,
  Loader2,
  Menu,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { AtlasLogo } from "@/components/brand/atlas-logo";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { type AppRole } from "@/lib/access-control";
import type { DashboardData } from "@/lib/kobo";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  role: AppRole;
  data?: DashboardData | null;
  isLoaded: boolean;
  isNavOpen: boolean;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenNav?: () => void;
};

const ROLE_BADGE_STYLE: Record<AppRole, string> = {
  admin:
    "border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 text-[var(--color-brand)]",
  producer:
    "border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  public:
    "border-[var(--color-muted)]/30 bg-[var(--color-muted)]/10 text-[var(--color-muted)]",
};

const ROLE_LABEL_KEYS = {
  admin: "role.admin",
  producer: "role.producer",
  public: "role.public",
} as const;

const LOCALE_LABEL_KEYS = {
  en: "locales.en",
  es: "locales.es",
  no: "locales.no",
} as const;

export function AppHeader({
  role,
  data,
  isLoaded,
  isNavOpen,
  onRefresh,
  isLoading,
  onOpenNav,
}: AppHeaderProps) {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const onLocaleChange = (value: string) => {
    router.replace(pathname, { locale: value as AppLocale });
  };

  const formattedUpdatedAt = (() => {
    if (!data?.stats.lastUpdated) return "-";
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
      new Date(data.stats.lastUpdated),
    );
  })();

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 overflow-hidden border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        {/* Left: Logo + brand (title; badge stacked under title on mobile, inline from sm) */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center sm:h-14 sm:w-14">
            <AtlasLogo size={50} priority />
          </div>
          <div className="flex min-w-0 flex-col items-start gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="whitespace-nowrap text-sm font-semibold leading-none tracking-tight text-[var(--color-brand)] sm:text-lg">
              BioDashboard
            </span>
            <Badge
              variant="outline"
              className={cn(
                "h-4 px-1.5 py-0 text-[10px] leading-none font-medium sm:h-auto sm:px-2 sm:py-0.5 sm:text-xs",
                ROLE_BADGE_STYLE[role],
              )}
            >
              {t(ROLE_LABEL_KEYS[role])}
            </Badge>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Last updated - desktop only */}
          <div className="hidden items-center gap-1.5 text-xs text-[var(--color-text-muted)] lg:flex">
            <Clock className="h-3.5 w-3.5" />
            <span>{formattedUpdatedAt}</span>
          </div>

          {/* Theme - desktop only */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>

          {/* Language selector - desktop only (>= lg) */}
          <div className="hidden lg:block">
            <Select value={locale} onValueChange={onLocaleChange}>
              <SelectTrigger className="h-11 min-h-11 w-auto min-w-[72px] border-0 bg-transparent text-xs font-medium text-[var(--color-text-secondary)] shadow-none hover:bg-[var(--color-surface-base)]">
                <div className="flex items-center gap-1">
                  <Languages className="h-3.5 w-3.5" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent
                position="popper"
                sideOffset={4}
                align="end"
                avoidCollisions
              >
                {routing.locales.map((entry) => (
                  <SelectItem key={entry} value={entry} className="uppercase">
                    {t(LOCALE_LABEL_KEYS[entry])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Refresh */}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-11 min-h-11 w-11 min-w-11 p-0 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]"
            aria-label={t("actions.refresh")}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>

          {/* Sign in - ghost, no fill */}
          {isLoaded ? (
            <Show when="signed-out">
              <SignInButton mode="modal">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-11 min-h-11 px-3 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)]"
                >
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
                  elements: { avatarBox: "h-11 w-11" },
                }}
              />
            </Show>
          ) : null}

          {/* Mobile overflow menu - contains Language selector (< lg) */}
          <div className="lg:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-11 min-h-11 w-11 min-w-11 p-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)]"
                  aria-label={t("navigation.more")}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={4} className="w-48">
                <div className="md:hidden">
                  <ThemeToggle variant="menu-item" />
                </div>
                {routing.locales.map((entry) => (
                  <DropdownMenuItem
                    key={entry}
                    onClick={() => onLocaleChange(entry)}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm",
                      locale === entry && "bg-accent text-accent-foreground",
                    )}
                  >
                    <Languages className="h-4 w-4" />
                    <span className="flex-1 uppercase">{entry}</span>
                    {locale === entry && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile nav hamburger - only admin & producer */}
          {role !== "public" && onOpenNav && (
            <Button
              type="button"
              variant="ghost"
              onClick={onOpenNav}
              className="flex h-11 w-11 items-center justify-center rounded-lg p-0 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-brand)] lg:hidden"
              aria-label={t("navigation.openMenu")}
              aria-expanded={isNavOpen}
              aria-haspopup="dialog"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
