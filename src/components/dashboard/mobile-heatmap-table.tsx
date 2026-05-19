"use client";

import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { translateSectionLabel } from "@/lib/section-labels";
import type { FacilitySummary } from "@/lib/kobo";

type Props = {
  facilities: FacilitySummary[];
  side: "external" | "internal";
  title: string;
  t: (key: string) => string;
};

export function MobileHeatmapTable({ facilities, side, title, t }: Props) {
  const rows = useMemo(() => {
    const sections = new Set<string>();
    const data: Record<string, Record<string, { score: number; compliant: boolean }>> = {};

    facilities.forEach((facility) => {
      data[facility.name] = {};
      facility.sectionScores
        .filter((s) => s.side === side)
        .forEach((section) => {
          sections.add(section.section);
          data[facility.name][section.section] = { score: section.score, compliant: section.score >= 70 };
        });
    });

    const sectionList = Array.from(sections);
    return { sectionList, data };
  }, [facilities, side]);

  if (rows.sectionList.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h4>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[140px]">{t("table.section")}</TableHead>
              {facilities.map((f) => (
                <TableHead key={f.id} className="min-w-[48px] text-center text-xs">{f.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.sectionList.map((section) => (
              <TableRow key={section}>
                <TableCell className="text-xs font-medium">{translateSectionLabel(section, t)}</TableCell>
                {facilities.map((f) => {
                  const cell = rows.data[f.name]?.[section];
                  return (
                    <TableCell key={f.id} className="text-center">
                      {cell ? (
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold ${
                          cell.compliant
                            ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                            : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                        }`}>
                          {cell.score}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">—</span>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
