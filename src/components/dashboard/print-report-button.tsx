"use client";

import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppLocale } from "@/i18n/routing";
import type { DashboardData, FacilitySummary } from "@/lib/kobo";
import { FacilityReport } from "./facility-report";

type Props = {
  facility: FacilitySummary;
  networkStats?: DashboardData["stats"];
  sectionAverages: DashboardData["sectionAverages"];
  locale: AppLocale;
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function PrintReportButton({ facility, networkStats, sectionAverages, locale, t }: Props) {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: reportRef,
    documentTitle: `${facility.name} - ${t("report.title")}`,
    pageStyle: `
      @page { size: A4; margin: 16mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  });

  return (
    <>
      <div className="flex flex-wrap gap-2 no-print">
        <Button type="button" variant="outline" size="sm" onClick={() => handlePrint()} className="gap-2">
          <Printer className="h-4 w-4" />
          {t("facilities.printReport")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => handlePrint()} className="gap-2">
          <Download className="h-4 w-4" />
          {t("facilities.downloadReport")}
        </Button>
      </div>

      <div className="sr-only">
         <FacilityReport
           ref={reportRef}
           facility={facility}
           networkStats={networkStats}
           sectionAverages={sectionAverages}
           locale={locale}
           t={t}
         />
      </div>
    </>
  );
}
