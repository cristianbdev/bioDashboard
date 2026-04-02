"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, UserPlus } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { FacilitySummary } from "@/lib/kobo";

type Props = {
  facilities: FacilitySummary[];
  projectUid: string;
  t: (key: string) => string;
};

type ManagedRole = "producer" | "admin";

type ApiResult = {
  status: "created" | "updated";
  email: string;
  role: ManagedRole;
  userId: string;
  projectUid: string;
  facilityId: number | null;
  password: string;
};

export function UserManagementView({ facilities, projectUid, t }: Props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ManagedRole>("producer");
  const [facilityId, setFacilityId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);

  const selectedFacility = useMemo(
    () => facilities.find((facility) => facility.id === Number(facilityId)),
    [facilities, facilityId],
  );

  async function onCreateUser() {
    setError(null);
    setResult(null);

    if (!email.trim()) {
      setError(t("users.error.emailRequired"));
      return;
    }

    if (role === "producer" && !facilityId) {
      setError(t("users.error.facilityRequired"));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
          facilityId: role === "producer" ? Number(facilityId) : undefined,
          facilityName: role === "producer" ? selectedFacility?.name : undefined,
          projectUid,
        }),
      });

      const payload = (await response.json()) as ApiResult & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || t("users.error.generic"));
      }

      setResult(payload);
      if (role === "producer") {
        setEmail("");
      }
    } catch (requestError: unknown) {
      const message = requestError instanceof Error ? requestError.message : t("users.error.generic");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-slate-900">
            <UserPlus className="h-4 w-4" />
            <h3 className="text-base font-semibold">{t("users.title")}</h3>
          </div>
          <CardDescription>{t("users.subtitle")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">{t("users.email")}</p>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="producer@example.com"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">{t("users.role")}</p>
              <Select value={role} onValueChange={(value) => setRole(value as ManagedRole)}>
                <SelectTrigger>
                  <SelectValue placeholder={t("users.role")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="producer">{t("role.producer")}</SelectItem>
                  <SelectItem value="admin">{t("role.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "producer" && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">{t("users.facility")}</p>
                <Select value={facilityId} onValueChange={setFacilityId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("users.facilityPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {facilities.map((facility) => (
                      <SelectItem key={facility.id} value={String(facility.id)}>
                        {facility.name} ({facility.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500">{t("users.passwordPolicyHint")}</p>

          <Button onClick={onCreateUser} disabled={loading}>
            {loading ? t("users.creating") : t("users.create")}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t("users.error.title")}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>{t("users.success.title")}</AlertTitle>
          <AlertDescription>
            {t("users.success.message")}: {result.email} ({result.role})
            <br />
            {t("users.password")}: <span className="font-semibold">{result.password}</span>
            {result.facilityId ? (
              <>
                <br />
                {t("users.facility")}: {result.facilityId}
              </>
            ) : null}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
