import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

import type { KoboApiResponse } from "@/lib/kobo";
import { transformKoboData } from "@/lib/kobo";

// TEMPORARY fallback token (remove when env variable is configured)
const FALLBACK_KOBO_TOKEN = "d1250d2e8cf07e8ce354d3a1f867eada3e20ec08";

async function fetchFromKobo(uid: string) {
  const token = process.env.KOBOTOOLBOX_TOKEN || FALLBACK_KOBO_TOKEN;
  if (!token) {
    throw new Error("Missing Kobo API token");
  }

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

async function fetchFromLocal(): Promise<KoboApiResponse> {
  const filePath = path.join(process.cwd(), "koboData.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as KoboApiResponse;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");
  const useLocal = searchParams.get("useLocal") === "1";

  if (!uid && !useLocal) {
    return NextResponse.json(
      { error: "uid requerido o usar snapshot local" },
      { status: 400 },
    );
  }

  try {
    const raw = useLocal ? await fetchFromLocal() : await fetchFromKobo(uid!);
    const data = transformKoboData(raw);
    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Kobo API error", error);
    return NextResponse.json(
      { error: error?.message ?? "Error inesperado" },
      { status: 500 },
    );
  }
}
