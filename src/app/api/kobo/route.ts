import { NextResponse } from "next/server";

import type { KoboApiResponse, KoboAssetResponse } from "@/lib/kobo";
import { transformKoboData } from "@/lib/kobo";
import type { QuantificationCatalog } from "@/lib/risk-quantification";
import scoreModel from "@/data/score-model.json";

const SCORE_CATALOG = scoreModel as QuantificationCatalog;

function getKoboToken() {
  const token = process.env.KOBOTOOLBOX_TOKEN;
  if (!token) {
    throw new Error("Missing KOBOTOOLBOX_TOKEN environment variable");
  }
  return token;
}

async function fetchKoboData(uid: string, token: string) {
  const url = `https://kf.kobotoolbox.org/api/v2/assets/${uid}/data.json`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Kobo API error ${res.status}`);
  }

  return (await res.json()) as KoboApiResponse;
}

async function fetchKoboAsset(uid: string, token: string) {
  const url = `https://kf.kobotoolbox.org/api/v2/assets/${uid}/`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Token ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Kobo asset API error ${res.status}`);
  }

  return (await res.json()) as KoboAssetResponse;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json(
      { error: "uid requerido" },
      { status: 400 },
    );
  }

  try {
    const token = getKoboToken();
    const [raw, asset] = await Promise.all([
      fetchKoboData(uid, token),
      fetchKoboAsset(uid, token),
    ]);
    const data = transformKoboData(raw, asset, SCORE_CATALOG);
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error inesperado";
    console.error("Kobo API error", error);
    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}
