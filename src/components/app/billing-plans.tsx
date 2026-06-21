"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { Loader2, Check, Star, Smartphone, CreditCard } from "lucide-react";
import { submitManualPayment, startOnlinePayment } from "@/app/(app)/billing/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { ActionState } from "@/lib/validation";

type Plan = { id: string; name: string; price: number; features: string[]; popular?: boolean };

export function BillingPlans({
  plans,
  currentPlan,
  bkash,
  nagad,
  onlineEnabled = false,
}: {
  plans: Plan[];
  currentPlan: string;
  bkash: string;
  nagad: string;
  onlineEnabled?: boolean;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(submitManualPayment, {});
  const [selected, setSelected] = useState<Plan | null>(null);
  const [payingOnline, startOnline] = useTransition();
  const toast = useToast();

  function payOnline(planId: string) {
    startOnline(async () => {
      const r = await startOnlinePayment(planId, 1);
      if (r.ok && r.url) window.location.href = r.url;
      else toast({ title: r.error ?? "Could not start online payment", variant: "error" });
    });
  }

  useEffect(() => {
    if (state.ok) {
      toast({ title: "Payment submitted", description: "We'll activate your plan once it's verified.", variant: "success" });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelected(null);
    } else if (state.error) {
      toast({ title: state.error, variant: "error" });
    }
  }, [state, toast]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.id === currentPlan;
          const isSelected = selected?.id === p.id;
          return (
            <Card
              key={p.id}
              className={cn(
                "relative p-6 transition-all",
                isSelected ? "border-accent ring-1 ring-accent" : p.popular ? "border-accent/50" : "border-border",
              )}
            >
              {p.popular && (
                <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground">
                  <Star className="size-3 fill-current" /> Popular
                </span>
              )}
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <p className="mt-2">
                <span className="font-display text-3xl font-semibold">৳{p.price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-2"><Check className="size-4 shrink-0 text-success" /> {f}</li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={isCurrent ? "outline" : "gold"}
                disabled={isCurrent}
                onClick={() => setSelected(isSelected ? null : p)}
              >
                {isCurrent ? "Current plan" : isSelected ? "Selected" : "Choose plan"}
              </Button>
            </Card>
          );
        })}
      </div>

      {selected && (
        <Card className="animate-rise">
          <CardContent className="pt-6">
            <h3 className="font-display text-lg font-semibold">Pay for {selected.name} — ৳{selected.price.toLocaleString()}/month</h3>

            {onlineEnabled && (
              <div className="mt-4">
                <Button variant="gold" disabled={payingOnline} onClick={() => payOnline(selected.id)}>
                  {payingOnline ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                  Pay online (card / bKash / Nagad)
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">Instant activation via SSLCommerz. Or pay manually below.</p>
                <div className="hairline my-5" />
              </div>
            )}

            <div className="mt-4 rounded-lg border border-accent/30 bg-accent-soft/40 p-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><Smartphone className="size-4 text-accent" /> Send money, then enter the Transaction ID below:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• <strong className="text-foreground">bKash</strong> (Send Money): <span className="tabular font-medium text-foreground">{bkash}</span></li>
                <li>• <strong className="text-foreground">Nagad</strong> (Send Money): <span className="tabular font-medium text-foreground">{nagad}</span></li>
                <li>• Amount: <span className="tabular font-medium text-foreground">৳{selected.price.toLocaleString()}</span></li>
              </ul>
            </div>

            <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="plan" value={selected.id} />
              <input type="hidden" name="months" value="1" />
              <Field className="flex-1 min-w-[220px]">
                <Label htmlFor="reference" required>bKash / Nagad Transaction ID</Label>
                <Input id="reference" name="reference" placeholder="e.g. 8N7A1B2C3D" required />
              </Field>
              <Button type="submit" variant="gold" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />} Submit payment
              </Button>
            </form>
            <p className="mt-2 text-xs text-muted-foreground">
              Your plan activates as soon as we verify the payment (usually within a few hours).
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
