import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { ATLAS_LOGO_ICONS } from "@/lib/brand/logo";
import { routing } from "@/i18n/routing";

const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    return {};
  }

  const t = await getTranslations({ locale });
  const title = t("meta.title");
  const description = t("meta.description");
  const canonicalPath = `/${locale}/dashboard`;

  return {
    metadataBase: new URL(appBaseUrl),
    title,
    description,
    icons: {
      icon: [...ATLAS_LOGO_ICONS],
      apple: [...ATLAS_LOGO_ICONS],
    },
    alternates: {
      canonical: canonicalPath,
      languages: {
        en: "/en/dashboard",
        es: "/es/dashboard",
        no: "/no/dashboard",
        "x-default": "/en/dashboard",
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalPath,
      locale,
      type: "website",
      siteName: title,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className="flex-1">{children}</div>
      <Footer />
    </NextIntlClientProvider>
  );
}
