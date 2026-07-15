import type { FacilitySummary } from "@/lib/kobo";

export type ProducerFacilityErrorCode = "facilityNotConfigured" | "facilityNotFound";

export type ProducerFacilityResolution =
  | { ok: true; facilities: FacilitySummary[]; facilityId: number }
  | { ok: false; errorCode: ProducerFacilityErrorCode; facilityId?: number };

/**
 * Resolves the single facility a producer is allowed to see.
 * Never falls back to another facility when the assignment is missing or invalid.
 */
export function resolveProducerFacilities(
  facilities: FacilitySummary[],
  producerFacilityId?: number,
): ProducerFacilityResolution {
  if (producerFacilityId === undefined) {
    return { ok: false, errorCode: "facilityNotConfigured" };
  }

  const match = facilities.find((facility) => facility.id === producerFacilityId);
  if (!match) {
    return { ok: false, errorCode: "facilityNotFound", facilityId: producerFacilityId };
  }

  return { ok: true, facilities: [match], facilityId: producerFacilityId };
}

export function pickProducerFacilityId(
  facilities: FacilitySummary[],
  producerFacilityId?: number,
): number | null {
  const resolution = resolveProducerFacilities(facilities, producerFacilityId);
  return resolution.ok ? resolution.facilityId : null;
}
