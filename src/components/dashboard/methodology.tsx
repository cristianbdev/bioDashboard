import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { DashboardData } from "@/lib/kobo";
import { InfoTitle } from "./info-title";

type Props = {
  data: DashboardData;
  t: (key: string) => string;
};

export function MethodologyView({ data, t }: Props) {
  const model = data.scoringMethodology;

  return (
    <div className="space-y-6 min-w-0">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("methodology.title")} info={t("methodology.info")} />
          <CardDescription>{t("methodology.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <p>{t("methodology.formulaA")}</p>
          <p>{t("methodology.formulaB")}</p>
          <p>{t("methodology.formulaC")}</p>
          <p className="text-slate-500">
            {t("methodology.sideWeights")}: {t("overview.external")}={model.sideWeights.external * 100}% |{" "}
            {t("overview.internal")}={model.sideWeights.internal * 100}%
          </p>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("methodology.subcategoryWeights")} info={t("methodology.subcategoryWeightsInfo")} />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{t("table.section")}</TableHead>
                <TableHead>{t("table.side")}</TableHead>
                <TableHead className="text-right">{t("table.weight")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {model.subcategoryWeights.map((row) => (
                <TableRow key={`${row.side}-${row.section}`}>
                  <TableCell className="font-medium">{row.section}</TableCell>
                  <TableCell>{row.side === "external" ? t("overview.external") : t("overview.internal")}</TableCell>
                  <TableCell className="text-right">{row.weight.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <InfoTitle title={t("methodology.rulesTitle")} info={t("methodology.rulesInfo")} />
          <CardDescription>{t("methodology.rulesSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {model.questionRules.map((rule) => (
            <div key={`${rule.section}-${rule.id}`} className="rounded-md border border-slate-200 p-3">
              <div className="mb-2 flex flex-col gap-1 text-sm">
                <p className="font-semibold text-slate-900">
                  {rule.id} - {rule.question}
                </p>
                <p className="text-slate-600">
                  {rule.section} | {rule.side === "external" ? t("overview.external") : t("overview.internal")}
                </p>
                <p className="text-slate-600">
                  {t("table.weight")}: {rule.questionWeight} | {t("methodology.mainScore")}: {rule.mainScore ? "1" : "0"}
                </p>
              </div>
              {rule.responses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>{t("table.answer")}</TableHead>
                      <TableHead className="text-right">{t("table.score")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rule.responses.map((response, index) => (
                      <TableRow key={`${rule.id}-${index}`}>
                        <TableCell>{response.response}</TableCell>
                        <TableCell className="text-right">{response.score === null ? "N/A" : response.score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-slate-500">{t("methodology.noResponseRules")}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
