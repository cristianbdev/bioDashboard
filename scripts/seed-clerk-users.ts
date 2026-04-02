import { readFileSync } from "node:fs";

import { clerkClient } from "@clerk/nextjs/server";

import { DEFAULT_PROJECT_UID } from "@/lib/access-control";
import type { KoboApiResponse, KoboAssetResponse } from "@/lib/kobo";
import { transformKoboData } from "@/lib/kobo";
import type { QuantificationCatalog } from "@/lib/risk-quantification";
import scoreModel from "@/data/score-model.json";

type ManagedRole = "admin" | "producer";

const SCORE_CATALOG = scoreModel as QuantificationCatalog;

function defaultPassword(email: string) {
  return `${email}.bioDash`;
}

function buildUsernameFromEmail(email: string) {
  const [local = "user", domain = "bio"] = email.split("@");
  const domainBase = domain.split(".")[0] || "bio";
  const raw = `${local}_${domainBase}`;
  const username = raw.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").slice(0, 30);
  return username.length >= 3 ? username : `${username}usr`;
}

async function upsertUser(params: {
  email: string;
  role: ManagedRole;
  projectUid: string;
  facilityId?: number;
  facilityName?: string;
}) {
  const client = await clerkClient();
  const email = params.email.trim().toLowerCase();
  const password = defaultPassword(email);

  const metadata =
    params.role === "producer"
      ? {
          role: params.role,
          projectUid: params.projectUid,
          facilityId: params.facilityId,
          facilityName: params.facilityName,
        }
      : {
          role: params.role,
          projectUid: params.projectUid,
        };

  const existing = await client.users.getUserList({ emailAddress: [email], limit: 1 });

  if (existing.data.length > 0) {
    const current = existing.data[0];
    const updated = await client.users.updateUser(current.id, {
      password,
      skipPasswordChecks: true,
      publicMetadata: {
        ...(current.publicMetadata ?? {}),
        ...metadata,
      },
    });

    return { status: "updated" as const, userId: updated.id, email, password };
  }

  const created = await client.users.createUser({
    emailAddress: [email],
    username: buildUsernameFromEmail(email),
    password,
    skipPasswordChecks: true,
    publicMetadata: metadata,
  });

  return { status: "created" as const, userId: created.id, email, password };
}

async function main() {
  const raw = JSON.parse(readFileSync("kobo_data_example.json", "utf8")) as KoboApiResponse;
  const asset = JSON.parse(readFileSync("kobo_asset_example.json", "utf8")) as KoboAssetResponse;
  const dashboardData = transformKoboData(raw, asset, SCORE_CATALOG);

  if (dashboardData.facilities.length === 0) {
    throw new Error("No facilities found in example data");
  }

  const randomFacility =
    dashboardData.facilities[Math.floor(Math.random() * dashboardData.facilities.length)];

  const admin = await upsertUser({
    email: "kikabeur@gmail.com",
    role: "admin",
    projectUid: DEFAULT_PROJECT_UID,
  });

  const producer = await upsertUser({
    email: "producer@example.com",
    role: "producer",
    projectUid: DEFAULT_PROJECT_UID,
    facilityId: randomFacility.id,
    facilityName: randomFacility.name,
  });

  console.log("✅ Clerk users provisioned");
  console.log("Admin:", admin);
  console.log("Producer:", producer);
  console.log("Producer facility:", {
    id: randomFacility.id,
    name: randomFacility.name,
    location: randomFacility.location,
  });
}

void main();
