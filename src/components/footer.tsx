"use client";

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
    <footer className="mt-auto w-full border-t border-border bg-card">
      <div className="mx-auto max-w-[1600px] px-6 py-6">
        {/* Desktop: single row with all elements */}
        <div className="hidden items-center justify-between gap-6 sm:flex">
          {/* Developer logo */}
          <a
            href="https://cristianb.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 transition-opacity hover:opacity-80"
          >
            <img
              src="/cristianbdev-logo.png"
              alt="CristianBDev"
              width={1492}
              height={500}
              loading="lazy"
              className="h-10 w-auto object-contain"
            />
          </a>

          {/* Legal / attribution */}
          <div className="flex-1 text-center text-xs leading-relaxed text-muted-foreground">
            <p>
              {t("footer.developed")}{" "}
              <a
                href="https://cristianb.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                CristianBDev
              </a>
              . {t("footer.usage")}
            </p>
          </div>

          {/* Partners + Contact */}
          <div className="flex shrink-0 items-center gap-5">
            {/* Partner logos */}
            <div className="flex items-center gap-3">
              <a
                href="https://www.vetinst.no/en"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src={vetinstSrc}
                  alt={t("footer.vetinstAlt")}
                  width={260}
                  height={64}
                  loading="lazy"
                  className="h-10 w-auto object-contain"
                />
              </a>
              <a
                href="https://eupahw.eu/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-80"
              >
                <img
                  src="/partners/eupahw-logo-color.png"
                  alt={t("footer.eupahwAlt")}
                  width={2440}
                  height={911}
                  loading="lazy"
                  className="h-11 w-auto object-contain"
                />
              </a>
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-[var(--color-border-subtle)]" />

            {/* Contact */}
            <div className="text-right text-xs text-muted-foreground">
              <a
                href="mailto:hi@cristianb.dev"
                className="block text-muted-foreground transition-colors hover:text-primary"
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
            <a
              href="https://www.vetinst.no/en"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src={vetinstSrc}
                alt={t("footer.vetinstAlt")}
                width={260}
                height={64}
                loading="lazy"
                className="h-8 w-auto object-contain"
              />
            </a>
            <a
              href="https://eupahw.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/partners/eupahw-logo-color.png"
                alt={t("footer.eupahwAlt")}
                width={2440}
                height={911}
                loading="lazy"
                className="h-7 w-auto object-contain"
              />
            </a>
          </div>

          {/* Divider */}
          <div className="w-full h-px bg-[var(--color-border-subtle)]" />

          {/* Legal */}
          <div className="text-center text-2xs leading-relaxed text-muted-foreground">
            <p>
              {t("footer.developed")}{" "}
              <a
                href="https://cristianb.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                CristianBDev
              </a>.
            </p>
            <p className="mt-0.5">{t("footer.usage")}</p>
          </div>

          {/* Developer logo + contact */}
          <div className="flex items-center gap-3">
            <a
              href="https://cristianb.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="/cristianbdev-logo.png"
                alt="CristianBDev"
                width={1492}
                height={500}
                loading="lazy"
                className="h-7 w-auto object-contain"
              />
            </a>
            <div className="text-center text-2xs text-muted-foreground">
              <a
                href="mailto:hi@cristianb.dev"
                className="text-muted-foreground transition-colors hover:text-primary"
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
