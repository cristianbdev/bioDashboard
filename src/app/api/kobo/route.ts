import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { canRequestProjectUid, DEFAULT_PROJECT_UID, normalizeRole, parseFacilityId, type AppRole } from "@/lib/access-control";
import type { DashboardData, KoboApiResponse, KoboAssetResponse } from "@/lib/kobo";
import { transformKoboData } from "@/lib/kobo";
import type { QuantificationCatalog } from "@/lib/risk-quantification";
import scoreModel from "@/data/score-model.json";

const SCORE_CATALOG = scoreModel as QuantificationCatalog;

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
    console.error("Kobo API error", { status: response.status, uid: url.split("/").at(-2) });
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
    console.error("Kobo asset API error", { status: response.status, uid: url.split("/").at(-2) });
    throw new Error("koboAssetApiError");
  }

  return (await response.json()) as KoboAssetResponse;
}

// Debug function to check instrument index
function debugInstrumentIndex(asset?: KoboAssetResponse) {
  if (!asset?.content?.survey) {
    console.log("[DEBUG] No survey data found in asset");
    return;
  }
  const ids: string[] = [];
  asset.content.survey.forEach((q) => {
    if (q.type && q.type !== "begin_group" && q.type !== "end_group") {
      const xpath = q.$xpath || "";
      const name = q.name || "";
      const id = name || (xpath.includes("/") ? xpath.slice(xpath.lastIndexOf("/") + 1) : xpath);
      if (id) ids.push(id);
    }
  });
  console.log("[DEBUG] Total survey questions:", ids.length);
  const targetIds = ["_3_10", "_3_9", "_3_5", "_10_15", "_11_5", "_11_7", "_8_9"];
  const foundIds = ids.filter(id => targetIds.includes(id));
  console.log("[DEBUG] Found target IDs:", foundIds);
  const missingIds = targetIds.filter(id => !ids.includes(id));
  console.log("[DEBUG] Missing target IDs:", missingIds);
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
}

function sanitizeDataByRole(data: DashboardData, role: AppRole, producerFacilityId?: number): DashboardData {
  const facilities =
    role === "producer" && producerFacilityId
      ? data.facilities.filter((facility) => facility.id === producerFacilityId)
      : data.facilities;

  const scopedFacilities = role === "producer" && facilities.length === 0 ? data.facilities.slice(0, 1) : facilities;

  const scopedData: DashboardData = {
    ...data,
    facilities: scopedFacilities,
    stats: {
      ...data.stats,
      totalRecords: scopedFacilities.length,
      avgScore: average(scopedFacilities.map((facility) => facility.score)),
      avgExternalScore: average(scopedFacilities.map((facility) => facility.externalScore)),
      avgInternalScore: average(scopedFacilities.map((facility) => facility.internalScore)),
      negligibleRiskCount: scopedFacilities.filter((facility) => facility.riskLevel === "NEGLIGIBLE").length,
      lowRiskCount: scopedFacilities.filter((facility) => facility.riskLevel === "LOW" || facility.riskLevel === "NEGLIGIBLE").length,
      mediumRiskCount: scopedFacilities.filter((facility) => facility.riskLevel === "MEDIUM").length,
      highRiskCount: scopedFacilities.filter((facility) => facility.riskLevel === "HIGH").length,
    },
  };

  if (role === "admin") {
    return scopedData;
  }

  return {
    ...scopedData,
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
}

async function resolveAccessContext() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return {
        role: "public" as AppRole,
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
        role: "public" as AppRole,
        projectUid: undefined,
        facilityId: undefined,
      };
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ errorCode: "missingUid" }, { status: 400 });
  }

  try {
    const access = await resolveAccessContext();

    if (
      !canRequestProjectUid({
        role: access.role,
        uid,
        assignedProjectUid: access.projectUid,
        defaultProjectUid: DEFAULT_PROJECT_UID,
      })
    ) {
      return NextResponse.json({ errorCode: "unauthorizedProject" }, { status: 403 });
    }

    const token = getKoboToken();
    const [raw, asset] = await Promise.all([fetchKoboData(uid, token), fetchKoboAsset(uid, token)]);

    const dashboardData = transformKoboData(raw, asset, SCORE_CATALOG);
    const scopedData = sanitizeDataByRole(dashboardData, access.role, access.facilityId);

    return NextResponse.json({ data: scopedData, role: access.role });
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : "unexpected";
    console.error("Kobo API error", error);
    return NextResponse.json({ errorCode: code }, { status: 500 });
  }
}
