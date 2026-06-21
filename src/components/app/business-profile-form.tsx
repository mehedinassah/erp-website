"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Building2 } from "lucide-react";
import { updateBusinessProfile } from "@/app/(app)/settings/business/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, Field, FieldError } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import type { ActionState } from "@/lib/validation";
import type { TenantProfile } from "@/lib/tenant";

export function BusinessProfileForm({ profile }: { profile: TenantProfile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateBusinessProfile, {});
  const toast = useToast();
  const fe = state.fieldErrors ?? {};

  useEffect(() => {
    if (state.ok) toast({ title: "Business profile saved", variant: "success" });
    else if (state.error) toast({ title: state.error, variant: "error" });
  }, [state, toast]);

  return (
    <form action={action} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" /> Business details
          </CardTitle>
          <CardDescription>
            This information appears on your invoices, quotations, and purchase orders.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field className="sm:col-span-2">
            <Label htmlFor="name" required>Business name</Label>
            <Input id="name" name="name" defaultValue={profile.name} placeholder="e.g. Aarong Gulshan" />
            <FieldError>{fe.name}</FieldError>
          </Field>
          <Field>
            <Label htmlFor="legalName">Legal / registered name</Label>
            <Input id="legalName" name="legalName" defaultValue={profile.legalName ?? ""} placeholder="Optional" />
          </Field>
          <Field>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={profile.phone ?? ""} placeholder="01XXXXXXXXX" />
          </Field>
          <Field>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={profile.email ?? ""} placeholder="shop@example.com" />
          </Field>
          <Field>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" name="logoUrl" type="url" defaultValue={profile.logoUrl ?? ""} placeholder="https://…/logo.png" />
          </Field>
          <Field className="sm:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={profile.address ?? ""} placeholder="Shop address, area, city" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoicing &amp; tax</CardTitle>
          <CardDescription>Controls document numbering and the tax applied to sales.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field>
            <Label htmlFor="invoicePrefix">Order/invoice prefix</Label>
            <Input id="invoicePrefix" name="invoicePrefix" defaultValue={profile.invoicePrefix} placeholder="SO" maxLength={6} />
          </Field>
          <Field>
            <Label htmlFor="taxLabel">Tax label</Label>
            <Input id="taxLabel" name="taxLabel" defaultValue={profile.taxLabel} placeholder="VAT" maxLength={12} />
          </Field>
          <Field>
            <Label htmlFor="taxRatePct">Tax rate (%)</Label>
            <Input id="taxRatePct" name="taxRatePct" type="number" min={0} max={100} defaultValue={profile.taxRatePct} />
          </Field>
          <Field className="sm:col-span-3">
            <Label htmlFor="invoiceFooter">Invoice footer note</Label>
            <Input id="invoiceFooter" name="invoiceFooter" defaultValue={profile.invoiceFooter ?? ""} placeholder="e.g. Thank you for your business! Goods once sold are not returnable." />
          </Field>
        </CardContent>
      </Card>

      <Button type="submit" variant="gold" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        Save business profile
      </Button>
    </form>
  );
}
