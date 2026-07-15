"use client";

import { ArrowRight, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ActionItem = {
  priority: number;
  label: string;
  section: string;
  recommendation: string;
};

type Props = {
  items: ActionItem[];
  t: (key: string, values?: Record<string, string | number>) => string;
};

export function ActionPlanCard({ items, t }: Props) {
  if (items.length === 0) {
    return (
      <Card className="card-flat">
        <CardContent className="p-5">
          <p className="text-sm text-muted-foreground">{t("facilities.noActionItems")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-flat-interactive">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-warning" />
          <CardTitle className="text-base font-semibold text-foreground">{t("facilities.actionPlan")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.slice(0, 3).map((item, index) => (
          <div key={index} className="flex items-start gap-3 rounded-lg border border-border bg-background p-3">
            <span className="btn-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold">
              {item.priority}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{item.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{item.recommendation}</p>
              <p className="mt-1 text-xs font-medium text-primary">{item.section}</p>
            </div>
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
