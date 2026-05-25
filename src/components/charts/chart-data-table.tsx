"use client";

import { cn } from "@/lib/utils";

type ChartDataTableProps = {
  caption: string;
  headers: string[];
  rows: (string | number)[][];
  className?: string;
  visuallyHidden?: boolean;
};

/**
 * Accessible data table for chart data.
 * By default renders visually hidden (sr-only) so screen-reader users
 * can access the underlying numbers while sighted users see the chart.
 */
export function ChartDataTable({
  caption,
  headers,
  rows,
  className,
  visuallyHidden = true,
}: ChartDataTableProps) {
  return (
    <div
      className={cn(
        visuallyHidden && "sr-only",
        !visuallyHidden && "overflow-x-auto",
        className,
      )}
    >
      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left font-medium">{caption}</caption>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} scope="col" className="px-3 py-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
