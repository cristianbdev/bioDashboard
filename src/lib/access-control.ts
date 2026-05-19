export type AppRole = "public" | "producer" | "admin";

export type DashboardTab = "overview" | "facilities" | "comparative" | "methodology" | "users" | "summary";

export const DEFAULT_PROJECT_UID = "atWJrmvMK43Gtr6zny6vs7";

export const ROLE_ACCESS_MATRIX: Record<
  AppRole,
  {
    tabs: DashboardTab[];
    canUseCustomProjectUid: boolean;
    canViewMethodology: boolean;
    canViewComparative: boolean;
    canManageUsers: boolean;
  }
> = {
  public: {
    tabs: ["overview"],
    canUseCustomProjectUid: false,
    canViewMethodology: false,
    canViewComparative: false,
    canManageUsers: false,
  },
  producer: {
    tabs: ["overview", "facilities"],
    canUseCustomProjectUid: false,
    canViewMethodology: false,
    canViewComparative: false,
    canManageUsers: false,
  },
  admin: {
    tabs: ["overview", "facilities", "comparative", "methodology", "users"],
    canUseCustomProjectUid: true,
    canViewMethodology: true,
    canViewComparative: true,
    canManageUsers: true,
  },
};

export function normalizeRole(value: unknown): AppRole {
  if (value === "admin" || value === "producer" || value === "public") {
    return value;
  }
  return "public";
}

export function canAccessTab(role: AppRole, tab: DashboardTab): boolean {
  return ROLE_ACCESS_MATRIX[role].tabs.includes(tab);
}

export function canRequestProjectUid(params: {
  role: AppRole;
  uid: string;
  assignedProjectUid?: string;
  defaultProjectUid?: string;
}): boolean {
  const { role, uid, assignedProjectUid, defaultProjectUid = DEFAULT_PROJECT_UID } = params;

  if (ROLE_ACCESS_MATRIX[role].canUseCustomProjectUid) return true;

  if (role === "producer") {
    const allowedUid = assignedProjectUid || defaultProjectUid;
    return uid === allowedUid;
  }

  return uid === defaultProjectUid;
}

export function parseFacilityId(value: unknown): number | undefined {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}
