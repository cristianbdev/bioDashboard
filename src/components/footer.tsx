"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full border-t border-[var(--color-border-subtle)] bg-white">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Desktop layout */}
        <div className="hidden items-center justify-between gap-8 sm:flex">
          {/* Logo */}
          <div className="shrink-0">
            <Image
              src="/cristianbdev-logo.png"
              alt="CristianBDev"
              width={130}
              height={44}
              className="h-auto"
              priority={false}
            />
          </div>

          {/* Center: Authorization text */}
          <div className="flex-1 text-center text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <p>
              {t("footer.developed")}{" "}
              <span className="font-medium text-[var(--color-text-primary)]">CristianBDev</span>.
            </p>
            <p className="mt-0.5">
              {t("footer.usage")}
            </p>
          </div>

          {/* Right: Contact and copyright */}
          <div className="shrink-0 text-right text-xs text-[var(--color-text-muted)]">
            <a
              href="mailto:hi@cristianb.dev"
              className="block text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-brand)]"
            >
              hi@cristianb.dev
            </a>
            <span className="mt-1 block">&copy; {currentYear} CristianBDev</span>
          </div>
        </div>

        {/* Mobile layout - stacked, centered */}
        <div className="flex flex-col items-center gap-4 sm:hidden">
          <Image
            src="/cristianbdev-logo.png"
            alt="CristianBDev"
            width={120}
            height={40}
            className="h-auto"
            priority={false}
          />
          <div className="text-center text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
            <p>
              {t("footer.developed")}{" "}
              <span className="font-medium text-[var(--color-text-primary)]">CristianBDev</span>.
            </p>
            <p className="mt-0.5">
              {t("footer.usage")}
            </p>
          </div>
          <div className="text-center text-[11px] text-[var(--color-text-muted)]">
            <a
              href="mailto:hi@cristianb.dev"
              className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-brand)]"
            >
              hi@cristianb.dev
            </a>
            <span className="ml-2">&middot;</span>
            <span className="ml-2">&copy; {currentYear} CristianBDev</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
