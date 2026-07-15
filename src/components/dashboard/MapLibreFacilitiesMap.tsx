"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Map, { FullscreenControl, MapRef, Marker, NavigationControl, Popup, ScaleControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { AlertTriangle, CheckCircle, Info, MapPin } from "lucide-react";
import { useTheme } from "next-themes";
import Supercluster from "supercluster";
import type { AppLocale } from "@/i18n/routing";
import type { AppRole } from "@/lib/access-control";
import type { FacilitySummary } from "@/lib/kobo";
import {
  getMapMode,
  isRestrictedMapMode,
  RESTRICTED_CLUSTER_MAX_ZOOM,
  RESTRICTED_MAX_ZOOM,
  RESTRICTED_TARGET_SPAN_KM,
  maxZoomForSpanKm,
  type CityMapPoint,
  type MapMode,
} from "@/lib/map-privacy";
import { cn } from "@/lib/utils";

type PointProperties = {
  id: number;
  facility: FacilitySummary;
};

type CityPointProperties = {
  city: string;
  count: number;
};

type ClusterAggregateProperties = {
  facilityCount: number;
  cityCount: number;
};

type Props = {
  filteredFacilities: FacilitySummary[];
  t: (key: string, values?: Record<string, unknown>) => string;
  locale?: AppLocale;
  className?: string;
  role?: AppRole;
  restrictedCityPoints?: CityMapPoint[];
  producerOwnFacility?: FacilitySummary;
};

const MAP_STYLES = {
  light: "https://tiles.openfreemap.org/styles/liberty",
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
} as const;

const RISK_LEVELS: Array<{
  level: FacilitySummary["riskLevel"];
  labelKey: string;
  markerClass: string;
  textClass: string;
}> = [
  { level: "HIGH", labelKey: "map.riskHigh", markerClass: "bg-destructive", textClass: "text-destructive" },
  { level: "MEDIUM", labelKey: "map.riskMedium", markerClass: "bg-warning", textClass: "text-warning" },
  { level: "LOW", labelKey: "map.riskLow", markerClass: "bg-success", textClass: "text-success" },
  { level: "NEGLIGIBLE", labelKey: "map.riskNegligible", markerClass: "bg-muted", textClass: "text-muted-foreground" },
];

function facilityMarkerClass(level?: FacilitySummary["riskLevel"]) {
  return RISK_LEVELS.find((entry) => entry.level === level)?.markerClass ?? "bg-muted";
}

function facilityTextClass(level?: FacilitySummary["riskLevel"]) {
  return RISK_LEVELS.find((entry) => entry.level === level)?.textClass ?? "text-muted-foreground";
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

function getPreloadedImages(): Array<{ id: string; width: number; height: number; data: Uint8ClampedArray }> {
  const sizes = [8, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 40];
  const images: Array<{ id: string; width: number; height: number; data: Uint8ClampedArray }> = [];

  for (const size of sizes) {
    const imageData = createFallbackCircleImage(size);
    images.push({ id: `circle-${size}`, width: size, height: size, data: imageData.data });
    images.push({ id: `circle-stroked-${size}`, width: size, height: size, data: imageData.data });
  }

  return images;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}k`;
  return n.toString();
}

function cityMarkerClass(count: number) {
  if (count >= 12) return "map-city-marker map-city-marker-large";
  if (count >= 5) return "map-city-marker map-city-marker-medium";
  return "map-city-marker";
}

function clusterMarkerClass(count: number) {
  if (count >= 25) return "map-cluster-marker map-cluster-marker-large";
  if (count >= 10) return "map-cluster-marker map-cluster-marker-medium";
  return "map-cluster-marker";
}

function activateMarkerOnKeyDown(event: KeyboardEvent<HTMLButtonElement>, onActivate: () => void) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  onActivate();
}

export function MapLibreFacilitiesMap({
  filteredFacilities,
  t,
  locale = "en",
  className,
  role = "public",
  restrictedCityPoints = [],
  producerOwnFacility,
}: Props) {
  const mapMode: MapMode = getMapMode(role);
  const isRestricted = isRestrictedMapMode(mapMode);
  const isProducerMap = mapMode === "producer";
  const mapRef = useRef<MapRef>(null);
  const { resolvedTheme } = useTheme();
  const mapStyle = resolvedTheme === "dark" ? MAP_STYLES.dark : MAP_STYLES.light;
  const [selectedFacility, setSelectedFacility] = useState<FacilitySummary | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityMapPoint | null>(null);
  const [bounds, setBounds] = useState<[number, number, number, number]>([-180, -85, 180, 85]);
  const [zoom, setZoom] = useState(4);
  const [restrictedMaxZoom, setRestrictedMaxZoom] = useState(RESTRICTED_MAX_ZOOM);

  const cityPoints = useMemo(
    () => (isRestricted ? restrictedCityPoints : []),
    [isRestricted, restrictedCityPoints],
  );

  const points = useMemo(() => {
    if (isRestricted) {
      return cityPoints.map((city) => ({
        type: "Feature" as const,
        properties: { city: city.city, count: city.count },
        geometry: {
          type: "Point" as const,
          coordinates: [city.lng, city.lat],
        },
      }));
    }

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
  }, [cityPoints, filteredFacilities, isRestricted]);

  const supercluster = useMemo(() => {
    const sc = new Supercluster<PointProperties | CityPointProperties, ClusterAggregateProperties>({
      radius: 60,
      maxZoom: isRestricted ? RESTRICTED_CLUSTER_MAX_ZOOM : 16,
      map: (properties) => ({
        facilityCount: "count" in properties ? properties.count : 1,
        cityCount: "count" in properties ? 1 : 0,
      }),
      reduce: (accumulated, properties) => {
        accumulated.facilityCount += properties.facilityCount;
        accumulated.cityCount += properties.cityCount;
      },
    });
    sc.load(points);
    return sc;
  }, [isRestricted, points]);

  const clusters = useMemo(() => supercluster.getClusters(bounds, zoom), [supercluster, bounds, zoom]);

  const center = useMemo(() => {
    const coordinateSets: Array<[number, number]> = points.map((point) => [
      point.geometry.coordinates[1],
      point.geometry.coordinates[0],
    ]);

    if (producerOwnFacility?.geolocation) {
      coordinateSets.push([producerOwnFacility.geolocation[0], producerOwnFacility.geolocation[1]]);
    }

    if (coordinateSets.length === 0) return { lat: 4.5, lng: -74 };

    const latitudes = coordinateSets.map(([lat]) => lat);
    const longitudes = coordinateSets.map(([, lng]) => lng);

    return {
      lat: (Math.min(...latitudes) + Math.max(...latitudes)) / 2,
      lng: (Math.min(...longitudes) + Math.max(...longitudes)) / 2,
    };
  }, [points, producerOwnFacility]);

  const initialZoom = useMemo(() => {
    if (points.length <= 1) return isRestricted ? 8 : 10;
    if (points.length <= 5) return isRestricted ? 6 : 6;
    return isRestricted ? 5 : 4;
  }, [isRestricted, points.length]);

  const updateViewportState = useCallback(() => {
    if (!mapRef.current) return;

    const map = mapRef.current.getMap();
    const currentZoom = mapRef.current.getZoom();

    if (isRestricted && currentZoom > restrictedMaxZoom) {
      mapRef.current.setZoom(restrictedMaxZoom);
    }

    const b = map.getBounds();
    setBounds([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()]);
    setZoom(mapRef.current.getZoom());
  }, [isRestricted, restrictedMaxZoom]);

  const updateRestrictedMaxZoom = useCallback(() => {
    if (!isRestricted || !mapRef.current) return;

    const map = mapRef.current.getMap();
    const nextMaxZoom = maxZoomForSpanKm(
      RESTRICTED_TARGET_SPAN_KM,
      map.getCenter().lat,
      map.getContainer().clientWidth,
    );

    setRestrictedMaxZoom(nextMaxZoom);
    map.setMaxZoom(nextMaxZoom);
    if (map.getZoom() > nextMaxZoom) {
      map.setZoom(nextMaxZoom);
    }
  }, [isRestricted]);

  const expandCluster = (clusterId: number, lng: number, lat: number) => {
    const expansionZoom = supercluster.getClusterExpansionZoom(clusterId);
    const targetZoom = isRestricted ? Math.min(expansionZoom, restrictedMaxZoom) : expansionZoom;
    mapRef.current?.flyTo({ center: [lng, lat], zoom: targetZoom, duration: 500 });
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

  if (points.length === 0 && !producerOwnFacility?.geolocation) {
    return (
      <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-border bg-background px-4 text-center text-sm text-muted-foreground">
        {t("map.noGeo")}
      </div>
    );
  }

  const totalFacilities = isRestricted
    ? cityPoints.reduce((total, city) => total + city.count, 0) + (producerOwnFacility ? 1 : 0)
    : points.length;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="relative flex-1 overflow-hidden rounded-xl border border-border bg-background">
        <Map
          ref={mapRef}
          mapStyle={mapStyle}
          maxZoom={isRestricted ? restrictedMaxZoom : 22}
          initialViewState={{
            latitude: center.lat,
            longitude: center.lng,
            zoom: initialZoom,
          }}
          style={{ width: "100%", height: "100%" }}
          onMove={updateViewportState}
          onZoom={updateViewportState}
          onResize={updateRestrictedMaxZoom}
          onLoad={(event) => {
            updateRestrictedMaxZoom();
            updateViewportState();

            const map = event.target;
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

            if (!map.hasImage("circle-11")) {
              map.addImage("circle-11", {
                width: 11,
                height: 11,
                data: createFallbackCircleImage(11).data,
              });
            }

            const processedImages = new Set<string>();
            map.on("styleimagemissing", (e: { image?: { toString: () => string } }) => {
              const missingImageId = e.image?.toString() ?? "unknown";
              if (processedImages.has(missingImageId)) return;
              processedImages.add(missingImageId);

              if (missingImageId.includes("circle")) {
                if (!map.hasImage(missingImageId)) {
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
          onClick={() => {
            setSelectedFacility(null);
            setSelectedCity(null);
          }}
          dragRotate={false}
          touchPitch={false}
        >
          <NavigationControl position="bottom-right" showCompass={false} />
          <FullscreenControl position="bottom-right" />
          <ScaleControl position="bottom-right" />

          {clusters.map((cluster) => {
            const [lng, lat] = cluster.geometry.coordinates;

            if ("cluster" in cluster.properties && cluster.properties.cluster) {
              const clusterProps = cluster.properties as typeof cluster.properties & ClusterAggregateProperties;
              const facilityCount = isRestricted ? clusterProps.facilityCount : clusterProps.point_count;
              const clusterLabel = isRestricted
                ? t("map.cityClusterAria", { cities: clusterProps.cityCount, count: facilityCount })
                : t("map.clusterAria", { count: facilityCount });
              const clusterId = cluster.properties.cluster_id;
              const activateCluster = () => expandCluster(clusterId, lng, lat);

              return (
                <Marker
                  key={`cluster-${clusterId}`}
                  longitude={lng}
                  latitude={lat}
                  anchor="center"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation();
                    activateCluster();
                  }}
                >
                  <button
                    type="button"
                    tabIndex={0}
                    onKeyDown={(event) => activateMarkerOnKeyDown(event, activateCluster)}
                    aria-label={clusterLabel}
                    className={cn(
                      clusterMarkerClass(facilityCount),
                      "cursor-pointer select-none rounded-full border-2 border-[var(--color-text-inverse)] font-bold text-[var(--color-text-inverse)] shadow-lg transition-transform hover:scale-110",
                      facilityCount >= 25 ? "bg-destructive" : facilityCount >= 10 ? "bg-warning" : "bg-info",
                    )}
                  >
                    {formatNumber(facilityCount)}
                  </button>
                </Marker>
              );
            }

            if (isRestricted) {
              const cityProps = cluster.properties as CityPointProperties;
              const activateCity = () => {
                setSelectedCity({ city: cityProps.city, count: cityProps.count, lat, lng });
                setSelectedFacility(null);
              };

              return (
                <Marker
                  key={`city-${cityProps.city}`}
                  longitude={lng}
                  latitude={lat}
                  anchor="center"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation();
                    activateCity();
                  }}
                >
                  <button
                    type="button"
                    tabIndex={0}
                    onKeyDown={(event) => activateMarkerOnKeyDown(event, activateCity)}
                    aria-label={t("map.cityMarkerAria", { city: cityProps.city, count: cityProps.count })}
                    className={cn(
                      cityMarkerClass(cityProps.count),
                      "cursor-pointer select-none rounded-full border-2 border-[var(--color-text-inverse)] bg-primary font-bold text-[var(--color-text-inverse)] shadow-lg transition-transform hover:scale-110",
                    )}
                  >
                    {formatNumber(cityProps.count)}
                  </button>
                </Marker>
              );
            }

            const facility = (cluster.properties as PointProperties).facility;
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
                  setSelectedCity(null);
                }}
              >
                <button
                  type="button"
                  tabIndex={0}
                  onKeyDown={(event) =>
                    activateMarkerOnKeyDown(event, () => {
                      setSelectedFacility(facility);
                      setSelectedCity(null);
                    })
                  }
                  aria-label={t("map.markerAria", {
                    name: facility.name,
                    risk: t(`risk.${facility.riskLevel.toLowerCase()}`),
                    score: facility.score,
                  })}
                  className={cn(
                    "h-5 w-5 cursor-pointer rounded-full border-2 border-[var(--color-text-inverse)] p-0 shadow-md transition-transform hover:scale-125",
                    facilityMarkerClass(facility.riskLevel),
                  )}
                />
              </Marker>
            );
          })}

          {isProducerMap && producerOwnFacility?.geolocation ? (
            <Marker
              key={`producer-own-${producerOwnFacility.id}`}
              longitude={producerOwnFacility.geolocation[1]}
              latitude={producerOwnFacility.geolocation[0]}
              anchor="center"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                setSelectedFacility(producerOwnFacility);
                setSelectedCity(null);
              }}
            >
              <button
                type="button"
                tabIndex={0}
                onKeyDown={(event) =>
                  activateMarkerOnKeyDown(event, () => {
                    setSelectedFacility(producerOwnFacility);
                    setSelectedCity(null);
                  })
                }
                aria-label={t("map.ownFacilityAria", {
                  name: producerOwnFacility.name,
                  risk: t(`risk.${producerOwnFacility.riskLevel.toLowerCase()}`),
                  score: producerOwnFacility.score,
                })}
                className={cn(
                  "map-own-facility-marker h-6 w-6 cursor-pointer rounded-full border-2 border-[var(--color-text-inverse)] p-0 shadow-md transition-transform hover:scale-125",
                  facilityMarkerClass(producerOwnFacility.riskLevel),
                )}
              />
            </Marker>
          ) : null}

          {isProducerMap && selectedFacility?.id === producerOwnFacility?.id && producerOwnFacility.geolocation ? (
            <Popup
              longitude={producerOwnFacility.geolocation[1]}
              latitude={producerOwnFacility.geolocation[0]}
              anchor="bottom"
              onClose={() => setSelectedFacility(null)}
              closeButton={false}
              closeOnClick={false}
              offset={[0, -12]}
              className="z-50"
            >
              <FacilityPopup
                facility={producerOwnFacility}
                onClose={() => setSelectedFacility(null)}
                t={t}
                locale={locale}
              />
            </Popup>
          ) : null}

          {!isRestricted && selectedFacility?.geolocation ? (
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

          {isRestricted && selectedCity ? (
            <Popup
              longitude={selectedCity.lng}
              latitude={selectedCity.lat}
              anchor="bottom"
              onClose={() => setSelectedCity(null)}
              closeButton={false}
              closeOnClick={false}
              offset={[0, -16]}
              className="z-50"
            >
              <CityPopup city={selectedCity} onClose={() => setSelectedCity(null)} t={t} />
            </Popup>
          ) : null}
        </Map>
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-card px-3 py-3 sm:px-4">
        <div className="flex items-center justify-center md:hidden">
          <div className="flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm">
            <span className="font-bold text-primary">{totalFacilities}</span>
            <span>{totalFacilities === 1 ? t("table.facility") : t("tabs.facilities")}</span>
          </div>
        </div>

        {isRestricted ? (
          <p className="text-center text-xs text-muted-foreground sm:text-left">
            {isProducerMap ? t("map.producerZoomLimitNotice") : t("map.zoomLimitNotice")}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 sm:justify-start">
          {isRestricted ? (
            <>
              <div className="flex items-center gap-2 text-xs text-foreground">
                <MapPin className="h-3 w-3 text-primary" />
                <span>{t("map.areaLegend")}</span>
              </div>
              {isProducerMap ? (
                <div className="flex items-center gap-2 text-xs text-foreground">
                  <span className="map-own-facility-marker-legend h-3 w-3 rounded-full ring-1 ring-white shadow-sm" />
                  <span>{t("map.ownFacilityLegend")}</span>
                </div>
              ) : null}
            </>
          ) : (
            RISK_LEVELS.map((entry) => (
              <div key={entry.level} className="flex items-center gap-2 text-xs text-foreground">
                <span
                  className={cn("h-3 w-3 rounded-full ring-1 ring-white shadow-sm", entry.markerClass)}
                />
                <span>{t(entry.labelKey)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CityPopup({
  city,
  onClose,
  t,
}: {
  city: CityMapPoint;
  onClose: () => void;
  t: (key: string, values?: Record<string, unknown>) => string;
}) {
  return (
    <div className="relative min-w-[220px] overflow-hidden rounded-lg border border-border bg-card shadow-xl">
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
      <div className="space-y-2 px-4 py-4">
        <p className="text-2xs font-semibold uppercase tracking-wider text-primary">{t("map.cityPopupTitle")}</p>
        <h3 className="text-sm font-semibold text-foreground">{city.city}</h3>
        <p className="text-xs text-muted-foreground">{t("map.facilityCount", { count: city.count })}</p>
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
  t: (key: string, values?: Record<string, unknown>) => string;
  locale: AppLocale;
}) {
  const riskTextClass = facilityTextClass(facility.riskLevel);
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

      <div className="facility-popup-header flex items-center gap-3 border-b border-border px-4 py-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-background", riskTextClass)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 pr-6">
          <h3 className="truncate text-sm font-semibold text-foreground">{facility.name}</h3>
          <p className={cn("text-2xs font-semibold uppercase tracking-wider", riskTextClass)}>
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
