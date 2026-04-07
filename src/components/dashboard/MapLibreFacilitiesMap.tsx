"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { FullscreenControl, MapRef, Marker, NavigationControl, Popup, ScaleControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import Supercluster from "supercluster";
import type { Locale } from "@/lib/i18n";
import type { FacilitySummary } from "@/lib/kobo";
import { cn } from "@/lib/utils";

type PointProperties = {
  id: number;
  facility: FacilitySummary;
};

type Props = {
  filteredFacilities: FacilitySummary[];
  t: (key: string) => string;
  locale?: Locale;
  className?: string;
};

const MAP_STYLES = {
  cartoDark: {
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    key: "map.dark",
    icon: "🌙",
  },
  stadiaOutdoors: {
    url: "https://tiles.stadiamaps.com/styles/outdoors.json",
    key: "map.terrain",
    icon: "🗻",
  },
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

function formatNumber(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k`;
  return n.toString();
}

export function MapLibreFacilitiesMap({ filteredFacilities, t, locale = "en", className }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [mapStyle, setMapStyle] = useState<string>(MAP_STYLES.cartoDark.url);
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
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-4 text-center text-sm text-[var(--color-text-secondary)]">
        {t("map.noGeo")}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="relative flex-1 overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]">
        {/* Map style buttons - hidden on mobile, shown below */}
        <div className="absolute left-3 top-3 z-10 hidden items-center gap-2 md:flex max-w-[calc(100%-76px)] overflow-x-auto pb-1 pr-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {Object.entries(MAP_STYLES).map(([key, style]) => (
            <button
              key={key}
              type="button"
              onClick={() => setMapStyle(style.url)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors",
                mapStyle === style.url
                  ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                  : "border-[var(--color-border-subtle)] bg-white/95 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)]",
              )}
            >
              <span className="mr-1.5">{style.icon}</span>
              {t(style.key)}
            </button>
          ))}
        </div>

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
          onLoad={updateViewportState}
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
                      "flex cursor-pointer select-none items-center justify-center rounded-full border-2 border-white font-bold text-white shadow-lg transition-transform hover:scale-110",
                      isLarge ? "bg-[var(--color-danger)]" : isMedium ? "bg-[var(--color-warning)]" : "bg-[var(--color-info)]",
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
                  className="h-5 w-5 cursor-pointer rounded-full border-2 border-white shadow-md transition-transform hover:scale-125"
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
      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-white px-3 py-3 sm:px-4">
        {/* Map controls for mobile - ABOVE legend */}
        <div className="flex items-center justify-between gap-2 md:hidden">
          <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] shadow-sm">
            <span className="font-bold text-[var(--color-brand)]">{points.length}</span>
            <span>{points.length === 1 ? t("table.facility") : t("tabs.facilities")}</span>
          </div>
          <div className="flex items-center gap-2">
            {Object.entries(MAP_STYLES).map(([key, style]) => (
              <button
                key={key}
                type="button"
                onClick={() => setMapStyle(style.url)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium shadow-sm transition-colors",
                  mapStyle === style.url
                    ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white"
                    : "border-[var(--color-border-subtle)] bg-white text-[var(--color-text-secondary)]",
                )}
              >
                <span className="text-sm">{style.icon}</span>
                <span>{t(style.key)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Legend - Risk levels */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
          {RISK_LEVELS.map((entry) => (
            <div key={entry.level} className="flex items-center gap-2 text-xs text-[var(--color-text-primary)]">
              <span className="h-3 w-3 rounded-full ring-1 ring-white shadow-sm" style={{ backgroundColor: entry.color }} />
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
  locale: Locale;
}) {
  const color = markerColorByRisk(facility.riskLevel);
  const Icon = facility.riskLevel === "HIGH" ? AlertTriangle : facility.riskLevel === "LOW" || facility.riskLevel === "NEGLIGIBLE" ? CheckCircle : Info;

  return (
    <div className="relative min-w-[260px] overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-white shadow-xl">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-secondary)]"
        aria-label="Close"
      >
        ×
      </button>

      <div className="flex items-center gap-3 border-b border-[var(--color-border-subtle)] px-4 py-4" style={{ backgroundColor: "color-mix(in oklab, white 82%, var(--color-surface-base))" }}>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "white", color }}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 pr-6">
          <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{facility.name}</h3>
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color }}>
            {t(`risk.${facility.riskLevel.toLowerCase()}`)}
          </p>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3 text-xs">
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
      <span className="text-[var(--color-text-secondary)]">{label}</span>
      <span className="text-right font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}
