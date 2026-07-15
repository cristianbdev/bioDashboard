"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SESSION_KEY = "bioDashboard.surveyInviteDismissed";

type Props = {
  surveyUrl?: string;
  t: (key: string) => string;
};

export function SurveyInviteDialog({ surveyUrl, t }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!surveyUrl) return;
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY) === "true") return;

    const frame = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(frame);
  }, [surveyUrl]);

  const dismiss = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(false);
  };

  const participate = () => {
    sessionStorage.setItem(SESSION_KEY, "true");
    setOpen(false);
    if (surveyUrl) {
      window.open(surveyUrl, "_blank", "noopener,noreferrer");
    }
  };

  if (!surveyUrl) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardCheck className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">{t("surveyInvite.title")}</DialogTitle>
          <DialogDescription className="text-center">{t("surveyInvite.description")}</DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{t("surveyInvite.benefit1")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{t("surveyInvite.benefit2")}</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{t("surveyInvite.benefit3")}</span>
          </li>
        </ul>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={dismiss}>
            {t("surveyInvite.dismiss")}
          </Button>
          <Button type="button" className="btn-brand" onClick={participate}>
            {t("surveyInvite.participate")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
