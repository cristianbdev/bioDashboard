"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations();
  const locale = useLocale();
  const currentYear = new Date().getFullYear();

  const vetinstSrc =
    locale === "no"
      ? "/partners/vetinst-logo-no.svg"
      : "/partners/vetinst-logo-eng.svg";

  return (
    <footer className="mt-auto w-full border-t border-[var(--color-border-subtle)] bg-[var(--color-raised)]">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Desktop: single row with all elements */}
        <div className="hidden items-center justify-between gap-6 sm:flex">
          {/* Developer logo */}
          <div className="shrink-0">
            <Image
              src="/cristianbdev-logo.png"
              alt="CristianBDev"
              width={120}
              height={40}
              className="h-7 w-auto object-contain"
              priority={false}
            />
          </div>

          {/* Legal / attribution */}
          <div className="flex-1 text-center text-xs leading-relaxed text-[var(--color-text-secondary)]">
            <p>
              {t("footer.developed")}{" "}
              <span className="font-medium text-[var(--color-text-primary)]">
                CristianBDev
              </span>
              . {t("footer.usage")}
            </p>
          </div>

          {/* Partners + Contact */}
          <div className="flex shrink-0 items-center gap-5">
            {/* Partner logos */}
            <div className="flex items-center gap-3">
              <Image
                src={vetinstSrc}
                alt={t("footer.vetinstAlt")}
                width={130}
                height={32}
                className="h-7 w-auto object-contain"
              />
              <Image
                src="/partners/eupahw-logo-color.png"
                alt={t("footer.eupahwAlt")}
                width={110}
                height={41}
                className="h-7 w-auto object-contain"
              />
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-[var(--color-border-subtle)]" />

            {/* Contact */}
            <div className="text-right text-xs text-[var(--color-text-muted)]">
              <a
                href="mailto:hi@cristianb.dev"
                className="block text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-brand)]"
              >
                hi@cristianb.dev
              </a>
              <span className="mt-0.5 block">&copy; {currentYear} CristianBDev</span>
            </div>
          </div>
        </div>

        {/* Mobile: stacked layout */}
        <div className="flex flex-col items-center gap-4 sm:hidden">
          {/* Partners */}
          <div className="flex items-center gap-3">
            <Image
              src={vetinstSrc}
              alt={t("footer.vetinstAlt")}
              width={130}
              height={32}
              className="h-7 w-auto object-contain"
            />
            <Image
              src="/partners/eupahw-logo-color.png"
              alt={t("footer.eupahwAlt")}
              width={110}
              height={41}
              className="h-7 w-auto object-contain"
            />
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[var(--color-border-subtle)]" />

          {/* Legal */}
          <div className="text-center text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
            <p>
              {t("footer.developed")}{" "}
              <span className="font-medium text-[var(--color-text-primary)]">CristianBDev</span>.
            </p>
            <p className="mt-0.5">{t("footer.usage")}</p>
          </div>

          {/* Developer logo + contact */}
          <div className="flex items-center gap-3">
            <Image
              src="/cristianbdev-logo.png"
              alt="CristianBDev"
              width={100}
              height={33}
              className="h-6 w-auto object-contain"
              priority={false}
            />
            <div className="text-center text-[11px] text-[var(--color-text-muted)]">
              <a
                href="mailto:hi@cristianb.dev"
                className="text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-brand)]"
              >
                hi@cristianb.dev
              </a>
              <span className="ml-1.5">&middot;</span>
              <span className="ml-1.5">&copy; {currentYear}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
