"use client";

import { useTransition } from "react";
import { Loader2, Ban, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toggleTenantStatus, setTenantPlan } from "@/app/(app)/admin/actions";

const PLANS = ["TRIAL", "STARTER", "BUSINESS", "PRO"];

export function TenantRowActions({
  id,
  status,
  plan,
}: {
  id: string;
  status: string;
  plan: string;
}) {
  const [pending, startTransition] = useTransition();
  const suspended = status === "SUSPENDED";

  return (
    <div className="flex items-center justify-end gap-2">
      <Select
        defaultValue={plan}
        disabled={pending}
        onChange={(e) => {
          const value = e.target.value;
          startTransition(() => setTenantPlan(id, value));
        }}
        className="h-8 w-28 text-xs"
      >
        {PLANS.map((p) => (
          <option key={p} value={p}>
            {p.charAt(0) + p.slice(1).toLowerCase()}
          </option>
        ))}
      </Select>

      <Button
        type="button"
        size="sm"
        variant={suspended ? "gold" : "outline"}
        disabled={pending}
        className={
          suspended
            ? ""
            : "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
        }
        onClick={() => startTransition(() => toggleTenantStatus(id))}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : suspended ? (
          <>
            <CheckCircle2 className="size-3.5" /> Activate
          </>
        ) : (
          <>
            <Ban className="size-3.5" /> Suspend
          </>
        )}
      </Button>
    </div>
  );
}
