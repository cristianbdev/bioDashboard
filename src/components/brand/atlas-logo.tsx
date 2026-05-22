"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ATLAS_LOGO } from "@/lib/brand/logo";
import { cn } from "@/lib/utils";

type AtlasLogoProps = {
  className?: string;
  size?: number;
  alt?: string;
  priority?: boolean;
};

export function AtlasLogo({ className, size = 40, alt = "", priority }: AtlasLogoProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  const src = mounted && resolvedTheme === "dark" ? ATLAS_LOGO.dark : ATLAS_LOGO.light;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- theme-aware SVG swap without next/image SVG config
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("h-full w-full object-contain", className)}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
    />
  );
}
