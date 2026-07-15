import type { AppRole } from "@/lib/access-control";
import type { FacilitySummary, RestrictedMapPoint } from "@/lib/kobo";

export type MapMode = "admin" | "public" | "producer";

export type CityMapPoint = RestrictedMapPoint;

export const RESTRICTED_MAX_ZOOM = 12;
export const RESTRICTED_CLUSTER_MAX_ZOOM = 12;
export const RESTRICTED_TARGET_SPAN_KM = 15;
const MAP_WORLD_CIRCUMFERENCE_KM = 40075.016686;
/** ~17 km grid at the equator — balances area precision with privacy */
const AREA_GRID_DEGREES = 0.15;

type AreaCell = {
  count: number;
  lats: number[];
  lngs: number[];
  cities: Map<string, number>;
  facilityIds: Set<number>;
};

export type RestrictedMapAggregation = {
  points: CityMapPoint[];
  facilityAreaKeys: Map<number, string>;
};

export function getMapMode(role: AppRole): MapMode {
  if (role === "admin") return "admin";
  if (role === "producer") return "producer";
  return "public";
}

export function isRestrictedMapMode(mode: MapMode): boolean {
  return mode !== "admin";
}

/** Geographic grouping key — prefer Location over production "Based". */
export function getCityKey(facility: FacilitySummary): string {
  return (facility.location ?? facility.basedOn ?? "Unknown").trim() || "Unknown";
}

function quantizeCoordinate(value: number, step: number = AREA_GRID_DEGREES): number {
  return Number((Math.round(value / step) * step).toFixed(4));
}

function getAreaGridKey(lat: number, lng: number): string {
  return `${quantizeCoordinate(lat)},${quantizeCoordinate(lng)}`;
}

function pickAreaLabel(cities: Map<string, number>): string {
  const sorted = [...cities.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return "Unknown";
  const [primaryCity, primaryCount] = sorted[0];
  if (sorted.length === 1) return primaryCity;
  const otherCities = sorted.length - 1;
  return otherCities > 0 ? `${primaryCity} (+${otherCities})` : primaryCity;
}

function collectLocationKeys(facility: FacilitySummary): string[] {
  return [...new Set([getCityKey(facility), facility.location, facility.basedOn].filter(Boolean).map((key) => key!.trim()))];
}

function ensureCell(cells: Map<string, AreaCell>, gridKey: string): AreaCell {
  const existing = cells.get(gridKey);
  if (existing) return existing;

  const cell: AreaCell = { count: 0, lats: [], lngs: [], cities: new Map(), facilityIds: new Set() };
  cells.set(gridKey, cell);
  return cell;
}

function assignFacilityToCell(
  cells: Map<string, AreaCell>,
  facilityAreaKeys: Map<number, string>,
  gridKey: string,
  facility: FacilitySummary,
  lat?: number,
  lng?: number,
) {
  const cell = ensureCell(cells, gridKey);
  if (cell.facilityIds.has(facility.id)) return;

  cell.facilityIds.add(facility.id);
  cell.count += 1;
  facilityAreaKeys.set(facility.id, gridKey);

  const city = getCityKey(facility);
  cell.cities.set(city, (cell.cities.get(city) ?? 0) + 1);

  if (lat !== undefined && lng !== undefined) {
    cell.lats.push(lat);
    cell.lngs.push(lng);
  }
}

function cellsWithCoordinates(cells: Map<string, AreaCell>): string[] {
  return [...cells.entries()].filter(([, cell]) => cell.lats.length > 0).map(([gridKey]) => gridKey);
}

/**
 * Groups facilities into geographic grid cells. Counts every facility in the area,
 * not only those with GPS — geolocation is used for marker position only.
 */
export function aggregateFacilitiesForRestrictedMap(
  facilities: FacilitySummary[],
  excludeFacilityId?: number,
): RestrictedMapAggregation {
  const eligible = facilities.filter((facility) => excludeFacilityId === undefined || facility.id !== excludeFacilityId);
  const cells = new Map<string, AreaCell>();
  const facilityAreaKeys = new Map<number, string>();
  const locationToGridKey = new Map<string, string>();
  const unassigned: FacilitySummary[] = [];

  eligible.forEach((facility) => {
    if (!facility.geolocation) return;

    const [lat, lng] = facility.geolocation;
    const gridKey = getAreaGridKey(lat, lng);
    assignFacilityToCell(cells, facilityAreaKeys, gridKey, facility, lat, lng);

    collectLocationKeys(facility).forEach((key) => {
      locationToGridKey.set(key, gridKey);
    });
  });

  eligible.forEach((facility) => {
    if (facility.geolocation) return;

    const gridKey = collectLocationKeys(facility)
      .map((key) => locationToGridKey.get(key))
      .find(Boolean);

    if (gridKey) {
      assignFacilityToCell(cells, facilityAreaKeys, gridKey, facility);
      return;
    }

    unassigned.push(facility);
  });

  if (unassigned.length > 0) {
    const geoCellKeys = cellsWithCoordinates(cells);

    if (geoCellKeys.length === 1) {
      unassigned.forEach((facility) => assignFacilityToCell(cells, facilityAreaKeys, geoCellKeys[0], facility));
    } else if (geoCellKeys.length > 1) {
      const largestKey = [...cells.entries()]
        .filter(([, cell]) => cell.lats.length > 0)
        .sort((a, b) => b[1].count - a[1].count)[0]?.[0];

      if (largestKey) {
        unassigned.forEach((facility) => assignFacilityToCell(cells, facilityAreaKeys, largestKey, facility));
      }
    }
  }

  const points = Array.from(cells.entries())
    .filter(([, cell]) => cell.lats.length > 0)
    .map(([gridKey, cell]) => {
      const avgLat = cell.lats.reduce((total, value) => total + value, 0) / cell.lats.length;
      const avgLng = cell.lngs.reduce((total, value) => total + value, 0) / cell.lngs.length;

      return {
        gridKey,
        city: pickAreaLabel(cell.cities),
        count: cell.count,
        lat: quantizeCoordinate(avgLat),
        lng: quantizeCoordinate(avgLng),
      };
    });

  return { points, facilityAreaKeys };
}

/**
 * Groups facilities into geographic grid cells so markers spread across regions/countries
 * even when city names differ or repeat. Excludes a facility id (e.g. producer's own predio).
 */
export function aggregateFacilitiesByArea(
  facilities: FacilitySummary[],
  excludeFacilityId?: number,
): CityMapPoint[] {
  return aggregateFacilitiesForRestrictedMap(facilities, excludeFacilityId).points;
}

/** @deprecated Use aggregateFacilitiesByArea */
export function aggregateFacilitiesByCity(facilities: FacilitySummary[]): CityMapPoint[] {
  return aggregateFacilitiesByArea(facilities);
}

export function filterRestrictedMapPoints(
  points: RestrictedMapPoint[],
  filteredFacilities: FacilitySummary[],
): RestrictedMapPoint[] {
  const gridCounts = new Map<string, number>();

  filteredFacilities.forEach((facility) => {
    if (!facility.mapAreaKey) return;
    gridCounts.set(facility.mapAreaKey, (gridCounts.get(facility.mapAreaKey) ?? 0) + 1);
  });

  if (!filteredFacilities.some((facility) => facility.mapAreaKey)) {
    return points;
  }

  return points
    .map((point) => ({
      ...point,
      count: gridCounts.get(point.gridKey) ?? 0,
    }))
    .filter((point) => point.count > 0);
}

export function sanitizeFacilitiesForRestrictedRole(
  facilities: FacilitySummary[],
  facilityAreaKeys?: Map<number, string>,
): FacilitySummary[] {
  return facilities.map((facility) => ({
    ...facility,
    geolocation: undefined,
    mapAreaKey: facilityAreaKeys?.get(facility.id),
  }));
}

export function resolveProducerMapFacility(
  allFacilities: FacilitySummary[],
  producerFacilityId?: number,
): FacilitySummary | undefined {
  if (producerFacilityId === undefined) return undefined;
  const match = allFacilities.find((facility) => facility.id === producerFacilityId);
  if (!match?.geolocation) return undefined;
  return { ...match };
}

export function maxZoomForSpanKm(targetSpanKm: number, latitude: number, widthPx: number): number {
  if (targetSpanKm <= 0 || widthPx <= 0) return RESTRICTED_MAX_ZOOM;

  const latitudeScale = Math.max(0.01, Math.cos((latitude * Math.PI) / 180));
  const zoom = Math.log2((MAP_WORLD_CIRCUMFERENCE_KM * latitudeScale * widthPx) / (256 * targetSpanKm));
  return Math.max(0, Math.min(22, Number(zoom.toFixed(2))));
}
