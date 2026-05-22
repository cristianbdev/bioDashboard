import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { DEFAULT_PROJECT_UID, normalizeRole, parseFacilityId } from "@/lib/access-control";
import { checkRateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

type ManagedRole = "admin" | "producer";

type CreateManagedUserBody = {
  email?: string;
  role?: ManagedRole;
  facilityId?: number;
  facilityName?: string;
  projectUid?: string;
};

const ADMIN_USERS_RATE_LIMIT = 10;
const ADMIN_USERS_RATE_WINDOW_MS = 60_000;

function isManagedRole(value: unknown): value is ManagedRole {
  return value === "admin" || value === "producer";
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function getInvitationRedirectUrl(request: Request): string | undefined {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) {
    return `${configured}/en/dashboard`;
  }

  const origin = request.headers.get("origin");
  if (origin) {
    return `${origin.replace(/\/$/, "")}/en/dashboard`;
  }

  return undefined;
}

async function isCurrentUserAdmin() {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  return normalizeRole(user?.publicMetadata?.role) === "admin";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rate = checkRateLimit(`admin-users:${ip}`, ADMIN_USERS_RATE_LIMIT, ADMIN_USERS_RATE_WINDOW_MS);
  if (!rate.allowed) {
    return rateLimitResponse(rate.retryAfterSeconds);
  }

  if (!(await isCurrentUserAdmin())) {
    return NextResponse.json({ errorCode: "unauthorized" }, { status: 403 });
  }

  let body: CreateManagedUserBody;
  try {
    body = (await request.json()) as CreateManagedUserBody;
  } catch {
    return NextResponse.json({ errorCode: "invalidJson" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  if (!email || !email.includes("@")) {
    return NextResponse.json({ errorCode: "invalidEmail" }, { status: 400 });
  }

  const role: ManagedRole = isManagedRole(body.role) ? body.role : "producer";
  const projectUid = body.projectUid || DEFAULT_PROJECT_UID;
  const facilityId = parseFacilityId(body.facilityId);

  if (role === "producer" && !facilityId) {
    return NextResponse.json({ errorCode: "facilityRequired" }, { status: 400 });
  }

  const publicMetadata =
    role === "producer"
      ? {
          role,
          projectUid,
          facilityId,
          facilityName: body.facilityName || undefined,
        }
      : {
          role,
          projectUid,
        };

  try {
    const client = await clerkClient();
    const existing = await client.users.getUserList({ emailAddress: [email], limit: 1 });

    if (existing.data.length > 0) {
      const current = existing.data[0];
      const updated = await client.users.updateUser(current.id, {
        publicMetadata: {
          ...(current.publicMetadata ?? {}),
          ...publicMetadata,
        },
      });

      return NextResponse.json({
        status: "updated",
        userId: updated.id,
        email,
        role,
        projectUid,
        facilityId: role === "producer" ? facilityId : null,
      });
    }

    const redirectUrl = getInvitationRedirectUrl(request);
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      publicMetadata,
      ...(redirectUrl ? { redirectUrl } : {}),
    });

    return NextResponse.json({
      status: "invited",
      invitationId: invitation.id,
      email,
      role,
      projectUid,
      facilityId: role === "producer" ? facilityId : null,
    });
  } catch (error: unknown) {
    console.error("Admin users API error", error);
    return NextResponse.json({ errorCode: "generic" }, { status: 500 });
  }
}
