import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { routing } from "@/i18n/routing";
import {
  fetchDashboardForUid,
  resolveAccessContext,
  resolveInitialProjectUid,
  type KoboDashboardErrorCode,
} from "@/lib/kobo-dashboard";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ uid?: string }>;
};

export default async function DashboardPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { uid: requestedUid } = await searchParams;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const access = await resolveAccessContext();
  const initialUid = resolveInitialProjectUid(access, requestedUid);

  let initialData = null;
  let initialErrorCode: KoboDashboardErrorCode | undefined;

  const result = await fetchDashboardForUid(initialUid, access);
  if (result.ok) {
    initialData = result.data;
  } else {
    initialErrorCode = result.errorCode;
  }

  return (
    <DashboardClient initialUid={initialUid} initialData={initialData} initialErrorCode={initialErrorCode} />
  );
}
