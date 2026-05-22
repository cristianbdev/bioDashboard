"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { EChartsOption } from "echarts";
import { useChartTheme } from "@/hooks/useChartTheme";
import { echarts } from "@/lib/echarts";
import { cn } from "@/lib/utils";

const ReactEChartsCore = dynamic(() => import("echarts-for-react/lib/core"), { ssr: false });

type EChartsChartProps = {
  option?: EChartsOption;
  className?: string;
  emptyFallback?: ReactNode;
};

function EChartsChartInner({ option, className }: { option: EChartsOption; className?: string }) {
  const { themeName } = useChartTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const update = () => {
      const { width, height } = node.getBoundingClientRect();
      setReady(width > 0 && height > 0);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={cn("h-full min-h-0 w-full min-w-0", className)}>
      {ready ? (
        <ReactEChartsCore
          key={themeName}
          echarts={echarts}
          option={option}
          theme={themeName}
          notMerge
          lazyUpdate
          style={{ height: "100%", width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      ) : null}
    </div>
  );
}

export function EChartsChart({ option, className, emptyFallback }: EChartsChartProps) {
  if (!option) {
    return emptyFallback ? <div className={cn("h-full w-full", className)}>{emptyFallback}</div> : null;
  }

  return <EChartsChartInner option={option} className={className} />;
}
