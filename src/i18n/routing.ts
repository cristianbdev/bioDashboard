import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "es", "no"],
  defaultLocale: "en",
  localePrefix: "always",
  localeDetection: false,
});

export type AppLocale = (typeof routing.locales)[number];
