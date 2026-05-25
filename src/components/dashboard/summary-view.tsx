"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { FacilitySummary } from "@/lib/kobo";
import { RiskBadge } from "./cards";

type Props = {
  facility: FacilitySummary;
  peerAverage?: number;
  topActions: { label: string; section: string }[];
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function SummaryView({ facility, peerAverage, topActions, t }: Props) {
  return (
    <div className="space-y-6 min-w-0">
      <h1 className="sr-only">{t("producer.summary")}</h1>
      {/* Score KPI */}
      <Card className="card-flat">
        <CardContent className="p-5">
          <div className="flex flex-col items-center justify-center py-4">
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-2">
              {t("facilities.scoreSummary")}
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-5xl font-black font-scientific ${
                facility.score >= 70 ? "text-success" :
                facility.score >= 50 ? "text-warning" :
                "text-destructive"
              }`}>
                {facility.score}
              </span>
              <span className="text-lg font-medium text-muted-foreground">/100</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-md">
              {facility.score < 50
                ? t("facilities.scoreSummary.below50", { score: facility.score })
                : facility.score < 70
                ? t("facilities.scoreSummary.below70", { score: facility.score })
                : t("facilities.scoreSummary.good", { score: facility.score })}
            </p>
            {peerAverage !== undefined && (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("facilities.peerComparison", { score: facility.score, peerAverage, species: facility.species ?? "", region: facility.basedOn ?? facility.location ?? "" })}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Priorities */}
      <Card className="card-flat">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base font-semibold">{t("facilities.topPriorities")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {topActions.length > 0 ? topActions.slice(0, 3).map((action, i) => (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xs font-bold text-destructive">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.section}</p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">{t("facilities.noActionItems")}</p>
          )}
        </CardContent>
      </Card>

      {/* Risk Level */}
      <Card className="card-flat">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">{t("facilities.riskSummary")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <RiskBadge level={facility.riskLevel} label={t(`risk.${facility.riskLevel.toLowerCase()}`)} />
            <span className="text-sm text-muted-foreground">
              {facility.highRiskFactors.length} {t("facilities.risks.high").toLowerCase()} • {" "}
              {facility.moderateRiskFactors.length} {t("facilities.risks.medium").toLowerCase()}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
