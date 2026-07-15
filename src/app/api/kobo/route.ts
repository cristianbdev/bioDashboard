import { NextResponse } from "next/server";

import { fetchDashboardForUid, resolveAccessContext } from "@/lib/kobo-dashboard";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

const KOBO_RATE_LIMIT = 60;
const KOBO_RATE_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`kobo:${ip}`, KOBO_RATE_LIMIT, KOBO_RATE_WINDOW_MS);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ errorCode: "missingUid" }, { status: 400 });
  }

  const access = await resolveAccessContext();
  const result = await fetchDashboardForUid(uid, access);

  if (!result.ok) {
    return NextResponse.json({ errorCode: result.errorCode }, { status: result.status });
  }

  return NextResponse.json({ data: result.data, role: result.role });
}
