"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { FullscreenControl, MapRef, Marker, NavigationControl, Popup, ScaleControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useTheme } from "next-themes";
import Supercluster from "supercluster";
import type { AppLocale } from "@/i18n/routing";
import type { FacilitySummary } from "@/lib/kobo";
import { cn } from "@/lib/utils";

type PointProperties = {
  id: number;
  facility: FacilitySummary;
};

type Props = {
  filteredFacilities: FacilitySummary[];
  t: (key: string) => string;
  locale?: AppLocale;
  className?: string;
};

const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;

const RISK_LEVELS: Array<{ level: FacilitySummary["riskLevel"]; labelKey: string; color: string }> = [
  { level: "HIGH", labelKey: "map.riskHigh", color: "var(--color-danger)" },
  { level: "MEDIUM", labelKey: "map.riskMedium", color: "var(--color-warning)" },
  { level: "LOW", labelKey: "map.riskLow", color: "var(--color-success)" },
  { level: "NEGLIGIBLE", labelKey: "map.riskNegligible", color: "var(--color-muted)" },
];

const FALLBACK_MARKER_COLOR = "var(--color-muted)";

function markerColorByRisk(level?: FacilitySummary["riskLevel"]) {
  if (!level) return FALLBACK_MARKER_COLOR;
  return RISK_LEVELS.find((entry) => entry.level === level)?.color ?? FALLBACK_MARKER_COLOR;
}

function createFallbackCircleImage(size: number = 22): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new ImageData(size, size);
  }

  const center = size / 2;
  const radius = center - 1;

  // Create gradient for nicer appearance
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.7, "rgba(220, 220, 220, 1)");
  gradient.addColorStop(1, "rgba(180, 180, 180, 1)");

  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

// Pre-defined fallback images for common sprite patterns
function getPreloadedImages(): Array<{ id: string; width: number; height: number; data: Uint8ClampedArray }> {
  // Include more sizes to cover various sprite patterns
  const sizes = [8, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 40];
  const images: Array<{ id: string; width: number; height: number; data: Uint8ClampedArray }> = [];

  for (const size of sizes) {
    const imageData = createFallbackCircleImage(size);
    // Common circle sprite patterns - extract .data from ImageData
    images.push({ id: `circle-${size}`, width: size, height: size, data: imageData.data });
    // Also add variations like circle-stroked, circle-11, etc.
    images.push({ id: `circle-stroked-${size}`, width: size, height: size, data: imageData.data });
  }

  return images;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k`;
  return n.toString();
}

export function MapLibreFacilitiesMap({ filteredFacilities, t, locale = "en", className }: Props) {
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const mapStyle = resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
  const [selectedFacility, setSelectedFacility] = useState<FacilitySummary | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [zoom, setZoom] = useState(4);

  const points = useMemo(() => {
    return filteredFacilities
      .filter((facility) => facility.geolocation && facility.geolocation[0] && facility.geolocation[1])
      .map((facility) => ({
        type: "Feature" as const,
        properties: {
          id: facility.id,
          facility,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [facility.geolocation![1], facility.geolocation![0]],
        },
      }));
  }, [filteredFacilities]);

  const supercluster = useMemo(() => {
    const sc = new Supercluster<PointProperties>({
      radius: 60,
      maxZoom: 16,
    });
    sc.load(points);
    return sc;
  }, [points]);

  const clusters = useMemo(() => supercluster.getClusters(bounds, zoom), [supercluster, bounds, zoom]);

  const center = useMemo(() => {
    if (points.length === 0) return { lat: 4.5, lng: -74 };
    const latitudes = points.map((point) => point.geometry.coordinates[1]);
    const longitudes = points.map((point) => point.geometry.coordinates[0]);

    return {
      lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    };
  }, [points]);

  const initialZoom = useMemo(() => {
    if (points.length <= 1) return 10;
    if (points.length <= 5) return 6;
    return 4;
  }, [points.length]);

  const updateViewportState = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(mapRef.current.getZoom());
  }, []);

  const expandCluster = (clusterId: number, lng: number, lat: number) => {
    const expansionZoom = supercluster.getClusterExpansionZoom(clusterId);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: expansionZoom, duration: 500 });
  };

  useEffect(() => {
    if (!mapRef.current) return;

    const container = mapRef.current.getMap().getContainer();
    const zoomIn = container.querySelector<HTMLButtonElement>(".maplibregl-ctrl-zoom-in");
    const zoomOut = container.querySelector<HTMLButtonElement>(".maplibregl-ctrl-zoom-out");
    const fullscreen = container.querySelector<HTMLButtonElement>(".maplibregl-ctrl-fullscreen");

    if (zoomIn) {
      zoomIn.title = t("map.zoomIn");
      zoomIn.setAttribute("aria-label", t("map.zoomIn"));
    }
    if (zoomOut) {
      zoomOut.title = t("map.zoomOut");
      zoomOut.setAttribute("aria-label", t("map.zoomOut"));
    }
    if (fullscreen) {
      fullscreen.title = t("map.fullscreen");
      fullscreen.setAttribute("aria-label", t("map.fullscreen"));
    }
  }, [t, mapStyle, points.length]);

  if (points.length === 0) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-border bg-background px-4 text-center text-sm text-muted-foreground">
        {t("map.noGeo")}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-background">
        <Map
          ref={mapRef}
          mapStyle={mapStyle}
          initialViewState={{
            latitude: center.lat,
            longitude: center.lng,
            zoom: initialZoom,
          }}
          style={{ width: "100%", height: "100%" }}
          onMove={updateViewportState}
          onZoom={updateViewportState}
          onLoad={(event) => {
            updateViewportState();

            const map = event.target;

            // Pre-load fallback circle images to prevent missing sprite warnings
            const preloadedImages = getPreloadedImages();
            for (const img of preloadedImages) {
              if (!map.hasImage(img.id)) {
                map.addImage(img.id, {
                  width: img.width,
                  height: img.height,
                  data: img.data,
                });
              }
            }

            // Add specific missing circle-11 immediately if not present
            if (!map.hasImage('circle-11')) {
              map.addImage('circle-11', {
                width: 11,
                height: 11,
                data: createFallbackCircleImage(11).data,
              });
            }

            // Track processed images to avoid duplicate processing
            const processedImages = new Set<string>();

            // Handle any remaining missing images (fallback for dynamic requests)
            map.on('styleimagemissing', (e: { image?: { toString: () => string } }) => {
              // Safely get image name, with fallback for undefined
              const missingImageId = e.image?.toString() ?? 'unknown';

              if (processedImages.has(missingImageId)) return;
              processedImages.add(missingImageId);

              // Only handle circle-related sprites
              if (missingImageId.includes('circle')) {
                if (!map.hasImage(missingImageId)) {
                  // Extract size from pattern like "circle-11" or create default
                  const sizeMatch = missingImageId.match(/circle.*-(\d+)/);
                  const size = sizeMatch ? parseInt(sizeMatch[1], 10) : 20;

                  map.addImage(missingImageId, {
                    width: size,
                    height: size,
                    data: createFallbackCircleImage(size).data,
                  });
                }
              }
            });
          }}
          onClick={() => setSelectedFacility(null)}
          dragRotate={false}
          touchPitch={false}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
          <FullscreenControl position="bottom-right" />
          <ScaleControl position="bottom-right" />

          {clusters.map((cluster) => {
            const [lng, lat] = cluster.geometry.coordinates;

            if ("cluster" in cluster.properties && cluster.properties.cluster) {
              const pointCount = cluster.properties.point_count;
              const clusterId = cluster.properties.cluster_id;
              const size = Math.min(50, 30 + pointCount * 0.5);
              const isLarge = pointCount >= 25;
              const isMedium = pointCount >= 10 && pointCount < 25;

              return (
                <Marker
                  key={`cluster-${clusterId}`}
                  longitude={lng}
                  latitude={lat}
                  anchor="center"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation();
                    expandCluster(clusterId, lng, lat);
                  }}
                >
                  <div
                    className={cn(
                      "flex cursor-pointer select-none items-center justify-center rounded-full border-2 border-[var(--color-text-inverse)] font-bold text-[var(--color-text-inverse)] shadow-lg transition-transform hover:scale-110",
                      isLarge ? "bg-destructive" : isMedium ? "bg-warning" : "bg-[var(--color-info)]",
                    )}
                    style={{
                      width: `${size}px`,
                      height: `${size}px`,
                      fontSize: size > 35 ? "14px" : "12px",
                    }}
                  >
                    {formatNumber(pointCount)}
                  </div>
                </Marker>
              );
            }

            const facility = cluster.properties.facility;
            if (!facility) return null;

            return (
              <Marker
                key={`point-${facility.id}`}
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={(event) => {
                  event.originalEvent.stopPropagation();
                  setSelectedFacility(facility);
                }}
              >
                <div
                  className="h-5 w-5 cursor-pointer rounded-full border-2 border-[var(--color-text-inverse)] shadow-md transition-transform hover:scale-125"
                  style={{ backgroundColor: markerColorByRisk(facility.riskLevel) }}
                />
              </Marker>
            );
          })}

          {selectedFacility?.geolocation ? (
            <Popup
              longitude={selectedFacility.geolocation[1]}
              latitude={selectedFacility.geolocation[0]}
              anchor="bottom"
              onClose={() => setSelectedFacility(null)}
              closeButton={false}
              closeOnClick={false}
              offset={[0, -12]}
              className="z-50"
            >
              <FacilityPopup facility={selectedFacility} onClose={() => setSelectedFacility(null)} t={t} locale={locale} />
            </Popup>
          ) : null}
        </Map>
      </div>

      {/* Legend and Controls */}
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
        {/* Facility count (mobile) */}
        <div className="flex items-center justify-center md:hidden">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="font-bold text-primary">{points.length}</span>
            <span>{points.length === 1 ? t("table.facility") : t("tabs.facilities")}</span>
          </div>
        </div>

        {/* Legend - Risk levels */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
          {RISK_LEVELS.map((entry) => (
            <div key={entry.level} className="flex items-center gap-2 text-xs text-foreground">
              <span
                className="map-legend-dot h-3 w-3 rounded-full ring-1 ring-white shadow-sm"
                style={{ "--legend-dot-color": entry.color } as React.CSSProperties}
              />
              <span>{t(entry.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FacilityPopup({
  facility,
  onClose,
  t,
  locale,
}: {
  facility: FacilitySummary;
  onClose: () => void;
  t: (key: string) => string;
  locale: AppLocale;
}) {
  const color = markerColorByRisk(facility.riskLevel);
  const Icon = facility.riskLevel === "HIGH" ? AlertTriangle : facility.riskLevel === "LOW" || facility.riskLevel === "NEGLIGIBLE" ? CheckCircle : Info;

  return (
    <div className="relative min-w-[260px] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="touch-target absolute right-2 top-2 z-20 rounded-full border border-border bg-popover text-muted-foreground hover:bg-background"
        aria-label={t("actions.close")}
      >
        ×
      </button>

      <div className="flex items-center gap-3 border-b border-border px-4 py-4" style={{ backgroundColor: "color-mix(in oklab, var(--color-raised) 82%, var(--color-surface-base))" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background" style={{ color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 pr-6">
          <h3 className="truncate text-sm font-semibold text-foreground">{facility.name}</h3>
          <p className="text-2xs font-semibold uppercase tracking-wider" style={{ color }}>
            {t(`risk.${facility.riskLevel.toLowerCase()}`)}
          </p>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3 text-xs bg-background">
        <PopupRow label={t("overview.filterLocation")} value={facility.location || facility.basedOn || "-"} />
        <PopupRow label={t("table.score")} value={`${facility.score}/100`} />
        <PopupRow label={t("table.species")} value={facility.species || "-"} />
        <PopupRow label={t("table.system")} value={facility.productionSystem || "-"} />
        {facility.lastUpdated ? (
          <PopupRow
            label={t("header.lastUpdated")}
            value={new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(facility.lastUpdated))}
          />
        ) : null}
      </div>
    </div>
  );
}

function PopupRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
