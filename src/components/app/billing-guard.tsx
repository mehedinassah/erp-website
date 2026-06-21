"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, ArrowRight, LogOut, Sparkles } from "lucide-react";
import { logoutAction } from "@/app/(app)/account-actions";

type Access = {
  locked: boolean;
  onTrial: boolean;
  daysLeft: number;
  planName: string;
  reason: string;
};

// Pages a locked tenant may still reach (to pay / sign out).
const ALLOWED_WHEN_LOCKED = ["/billing", "/account"];

export function BillingGuard({ access, children }: { access: Access; children: React.ReactNode }) {
  const pathname = usePathname();
  const allowed = ALLOWED_WHEN_LOCKED.some((p) => pathname.startsWith(p));

  if (access.locked && !allowed) {
    const msg =
      access.reason === "trial_expired"
        ? "Your 14-day free trial has ended."
        : access.reason === "subscription_expired"
          ? "Your subscription has expired."
          : "Your account access is paused.";
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        <span className="grid size-16 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Lock className="size-8" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-semibold tracking-tight sm:text-3xl">{msg}</h1>
        <p className="mt-3 max-w-md text-muted-foreground">
          Your data is safe. Choose a plan and complete payment to unlock PERICO and continue where you left off.
        </p>
        <div className="mt-7 flex items-center gap-3">
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground shadow-lg shadow-accent/20 transition-transform hover:scale-[1.03]"
          >
            View plans & pay <ArrowRight className="size-4" />
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-3 text-sm font-semibold transition-colors hover:bg-muted">
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {access.onTrial && !access.locked && (
        <Link
          href="/billing"
          className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-accent/30 bg-accent-soft/50 px-4 py-2.5 text-sm transition-colors hover:bg-accent-soft print:hidden"
        >
          <span className="flex items-center gap-2 text-accent">
            <Sparkles className="size-4" />
            <strong>{access.daysLeft} day{access.daysLeft !== 1 ? "s" : ""} left</strong> in your free trial.
          </span>
          <span className="inline-flex items-center gap-1 font-medium text-accent">Upgrade <ArrowRight className="size-3.5" /></span>
        </Link>
      )}
      {children}
    </>
  );
}
