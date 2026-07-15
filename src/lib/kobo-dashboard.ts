import { auth, currentUser } from "@clerk/nextjs/server";

import {
  canRequestProjectUid,
  DEFAULT_PROJECT_UID,
  normalizeRole,
  parseFacilityId,
  type AppRole,
} from "@/lib/access-control";
import type { DashboardData, KoboApiResponse, KoboAssetResponse } from "@/lib/kobo";
import { transformKoboData } from "@/lib/kobo";
import {
  aggregateFacilitiesForRestrictedMap,
  resolveProducerMapFacility,
  sanitizeFacilitiesForRestrictedRole,
} from "@/lib/map-privacy";
import { resolveProducerFacilities, type ProducerFacilityErrorCode } from "@/lib/producer-facilities";
import type { QuantificationCatalog } from "@/lib/risk-quantification";
import scoreModel from "@/data/score-model.json";

const SCORE_CATALOG = scoreModel as QuantificationCatalog;

export type KoboDashboardErrorCode =
  | "missingUid"
  | "unauthorizedProject"
  | "missingToken"
  | "koboApiError"
  | "koboAssetApiError"
  | ProducerFacilityErrorCode
  | "rateLimited"
  | "unexpected";

export type AccessContext = {
  role: AppRole;
  projectUid?: string;
  facilityId?: number;
};

function getKoboToken() {
  const token = process.env.KOBOTOOLBOX_TOKEN;
  if (!token) {
    throw new Error("missingToken");
  }
  return token;
}

async function fetchKoboData(uid: string, token: string) {
  const url = `https://kf.kobotoolbox.org/api/v2/assets/${uid}/data.json`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Kobo API error", { status: response.status, uid });
    throw new Error("koboApiError");
  }

  return (await response.json()) as KoboApiResponse;
}

async function fetchKoboAsset(uid: string, token: string) {
  const url = `https://kf.kobotoolbox.org/api/v2/assets/${uid}/`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("Kobo asset API error", { status: response.status, uid });
    throw new Error("koboAssetApiError");
  }

  return (await response.json()) as KoboAssetResponse;
}

function extractSurveyUrl(asset: KoboAssetResponse): string | undefined {
  const links = asset.deployment__links;
  if (links?.single_url) return links.single_url;
  if (links?.url) return links.url;
  const fallback = process.env.NEXT_PUBLIC_KOBO_SURVEY_URL;
  return fallback && fallback.length > 0 ? fallback : undefined;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function buildStats(facilities: DashboardData["facilities"]): DashboardData["stats"] {
  return {
    totalRecords: facilities.length,
    avgScore: average(facilities.map((facility) => facility.score)),
    avgExternalScore: average(facilities.map((facility) => facility.externalScore)),
    avgInternalScore: average(facilities.map((facility) => facility.internalScore)),
    negligibleRiskCount: facilities.filter((facility) => facility.riskLevel === "NEGLIGIBLE").length,
    lowRiskCount: facilities.filter(
      (facility) => facility.riskLevel === "LOW" || facility.riskLevel === "NEGLIGIBLE",
    ).length,
    mediumRiskCount: facilities.filter((facility) => facility.riskLevel === "MEDIUM").length,
    highRiskCount: facilities.filter((facility) => facility.riskLevel === "HIGH").length,
    lastUpdated: facilities
      .map((facility) => facility.lastUpdated)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1),
  };
}

export function sanitizeDataByRole(
  data: DashboardData,
  role: AppRole,
  scopedFacilities: DashboardData["facilities"],
  networkFacilities: DashboardData["facilities"],
  producerFacilityId?: number,
): DashboardData {
  const scopedData: DashboardData = {
    ...data,
    facilities: scopedFacilities,
    stats: {
      ...data.stats,
      ...buildStats(scopedFacilities),
    },
  };

  if (role === "admin") {
    return scopedData;
  }

  const { points: restrictedMapPoints, facilityAreaKeys } = aggregateFacilitiesForRestrictedMap(
    networkFacilities,
    role === "producer" ? producerFacilityId : undefined,
  );
  const sanitizedScopedFacilities = sanitizeFacilitiesForRestrictedRole(scopedFacilities, facilityAreaKeys);
  const sanitizedNetworkFacilities = sanitizeFacilitiesForRestrictedRole(networkFacilities, facilityAreaKeys);

  const sharedRestrictedFields = {
    locations: [] as DashboardData["locations"],
    restrictedMapPoints,
    comparatives: {
      bySpecies: [],
      bySystem: [],
      byMarket: [],
      byEducation: [],
      byYearsOperation: [],
      byWaterSource: [],
      byProductionType: [],
      byLocation: [],
    },
    riskMatrixExternal: [],
    riskMatrixInternal: [],
    scoringMethodology: {
      ...scopedData.scoringMethodology,
      questionRules: [],
    },
  };

  if (role === "producer") {
    return {
      ...scopedData,
      facilities: sanitizedScopedFacilities,
      overviewFacilities: sanitizedNetworkFacilities,
      producerMapFacility: resolveProducerMapFacility(networkFacilities, producerFacilityId),
      stats: data.stats,
      ...sharedRestrictedFields,
    };
  }

  return {
    ...scopedData,
    facilities: sanitizedNetworkFacilities,
    stats: data.stats,
    ...sharedRestrictedFields,
  };
}

export async function resolveAccessContext(): Promise<AccessContext> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        role: "public",
        projectUid: undefined,
        facilityId: undefined,
      };
    }

    const user = await currentUser();
    const role = normalizeRole(user?.publicMetadata?.role);
    const projectUid =
      typeof user?.publicMetadata?.projectUid === "string" ? user.publicMetadata.projectUid : undefined;
    const facilityId = parseFacilityId(user?.publicMetadata?.facilityId);

    return {
      role,
      projectUid,
      facilityId,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("clerkMiddleware() was not run")) {
      return {
        role: "public",
        projectUid: undefined,
        facilityId: undefined,
      };
    }
    throw error;
  }
}

export function resolveInitialProjectUid(access: AccessContext, requestedUid?: string | null): string {
  if (access.role === "producer" && access.projectUid) {
    return access.projectUid;
  }
  if (requestedUid && requestedUid.length > 0) {
    return requestedUid;
  }
  return DEFAULT_PROJECT_UID;
}

export type FetchDashboardResult =
  | { ok: true; data: DashboardData; role: AppRole }
  | { ok: false; errorCode: KoboDashboardErrorCode; status: number };

export async function fetchDashboardForUid(uid: string, access?: AccessContext): Promise<FetchDashboardResult> {
  if (!uid) {
    return { ok: false, errorCode: "missingUid", status: 400 };
  }

  const context = access ?? (await resolveAccessContext());

  if (
    !canRequestProjectUid({
      role: context.role,
      uid,
      assignedProjectUid: context.projectUid,
      defaultProjectUid: DEFAULT_PROJECT_UID,
    })
  ) {
    return { ok: false, errorCode: "unauthorizedProject", status: 403 };
  }

  try {
    const token = getKoboToken();
    const [raw, asset] = await Promise.all([fetchKoboData(uid, token), fetchKoboAsset(uid, token)]);
    const dashboardData: DashboardData = {
      ...transformKoboData(raw, asset, SCORE_CATALOG),
      surveyUrl: extractSurveyUrl(asset),
    };

    let scopedFacilities = dashboardData.facilities;
    const networkFacilities = dashboardData.facilities;

    if (context.role === "producer") {
      const producerResolution = resolveProducerFacilities(dashboardData.facilities, context.facilityId);
      if (!producerResolution.ok) {
        return { ok: false, errorCode: producerResolution.errorCode, status: 403 };
      }
      scopedFacilities = producerResolution.facilities;
    }

    const scopedData = sanitizeDataByRole(
      dashboardData,
      context.role,
      scopedFacilities,
      networkFacilities,
      context.facilityId,
    );
    return { ok: true, data: scopedData, role: context.role };
  } catch (error: unknown) {
    const code = (error instanceof Error ? error.message : "unexpected") as KoboDashboardErrorCode;
    const status = code === "missingToken" ? 500 : 500;
    console.error("Kobo dashboard fetch error", error);
    return { ok: false, errorCode: code, status };
  }
}
