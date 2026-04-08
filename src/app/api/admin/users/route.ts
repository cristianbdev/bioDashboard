import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import { DEFAULT_PROJECT_UID, normalizeRole, parseFacilityId } from "@/lib/access-control";

type ManagedRole = "admin" | "producer";

type CreateManagedUserBody = {
  email?: string;
  role?: ManagedRole;
  facilityId?: number;
  facilityName?: string;
  projectUid?: string;
};

function isManagedRole(value: unknown): value is ManagedRole {
  return value === "admin" || value === "producer";
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function buildDefaultPassword(email: string): string {
  return `${email}.bioDash`;
}

function buildUsernameFromEmail(email: string): string {
  const [local = "user", domain = "bio"] = email.split("@");
  const domainBase = domain.split(".")[0] || "bio";
  const raw = `${local}_${domainBase}`;
  const username = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").slice(0, 30);
  return username.length >= 3 ? username : `${username}usr`;
}

async function isCurrentUserAdmin() {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  return normalizeRole(user?.publicMetadata?.role) === "admin";
}

export async function POST(request: Request) {
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

  const password = buildDefaultPassword(email);

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
        password,
        skipPasswordChecks: true,
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
        password,
      });
    }

    const created = await client.users.createUser({
      emailAddress: [email],
      username: buildUsernameFromEmail(email),
      password,
      skipPasswordChecks: true,
      publicMetadata,
    });

    return NextResponse.json({
      status: "created",
      userId: created.id,
      email,
      role,
      projectUid,
      facilityId: role === "producer" ? facilityId : null,
      password,
    });
  } catch (error: unknown) {
    console.error("Admin users API error", error);
    return NextResponse.json({ errorCode: "generic" }, { status: 500 });
  }
}
