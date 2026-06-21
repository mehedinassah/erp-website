// SSLCommerz payment gateway (Bangladesh). Configure via env (Vercel + .env):
//   SSLCZ_STORE_ID, SSLCZ_STORE_PASSWD, SSLCZ_SANDBOX ("true" for sandbox)
// If unset, online payment is disabled and the billing page shows manual only.

import { SITE_URL } from "./site";

export function sslczConfigured(): boolean {
  return Boolean(process.env.SSLCZ_STORE_ID && process.env.SSLCZ_STORE_PASSWD);
}

function isSandbox(): boolean {
  return (process.env.SSLCZ_SANDBOX ?? "true").toLowerCase() !== "false";
}

function base(): string {
  return isSandbox() ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com";
}

/** Initialise a payment session; returns the gateway redirect URL. */
export async function initSession(opts: {
  tranId: string;
  amount: number;
  planName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!sslczConfigured()) return { ok: false, error: "Online payment is not configured." };

  const body = new URLSearchParams({
    store_id: process.env.SSLCZ_STORE_ID!,
    store_passwd: process.env.SSLCZ_STORE_PASSWD!,
    total_amount: String(opts.amount),
    currency: "BDT",
    tran_id: opts.tranId,
    success_url: `${SITE_URL}/api/billing/sslcommerz/success`,
    fail_url: `${SITE_URL}/api/billing/sslcommerz/fail`,
    cancel_url: `${SITE_URL}/api/billing/sslcommerz/cancel`,
    ipn_url: `${SITE_URL}/api/billing/sslcommerz/ipn`,
    product_name: `PERICO ${opts.planName} plan`,
    product_category: "SaaS Subscription",
    product_profile: "non-physical-goods",
    cus_name: opts.customerName,
    cus_email: opts.customerEmail || "billing@perico-erp.app",
    cus_phone: opts.customerPhone || "01000000000",
    cus_add1: "N/A",
    cus_city: "Dhaka",
    cus_country: "Bangladesh",
    shipping_method: "NO",
    num_of_item: "1",
  });

  try {
    const res = await fetch(`${base()}/gwprocess/v4/api.php`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const data = (await res.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
    if (data.status === "SUCCESS" && data.GatewayPageURL) {
      return { ok: true, url: data.GatewayPageURL };
    }
    return { ok: false, error: data.failedreason || "Could not start the payment session." };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Gateway error." };
  }
}

/** Validate a completed transaction with SSLCommerz (server-to-server check). */
export async function validatePayment(valId: string): Promise<{ ok: boolean; amount?: number; tranId?: string }> {
  if (!sslczConfigured() || !valId) return { ok: false };
  const url = new URL(`${base()}/validator/api/validationserverAPI.php`);
  url.searchParams.set("val_id", valId);
  url.searchParams.set("store_id", process.env.SSLCZ_STORE_ID!);
  url.searchParams.set("store_passwd", process.env.SSLCZ_STORE_PASSWD!);
  url.searchParams.set("format", "json");
  try {
    const res = await fetch(url.toString());
    const data = (await res.json()) as { status?: string; amount?: string; tran_id?: string };
    if (data.status === "VALID" || data.status === "VALIDATED") {
      return { ok: true, amount: Number(data.amount), tranId: data.tran_id };
    }
    return { ok: false };
  } catch {
    return { ok: false };
  }
}
