import { NextResponse, type NextRequest } from "next/server";
import { validatePayment } from "@/lib/sslcommerz";
import { activatePayment } from "@/lib/billing";
import { SITE_URL } from "@/lib/site";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const tranId = String(form.get("tran_id") ?? "");
    const valId = String(form.get("val_id") ?? "");
    const status = String(form.get("status") ?? "");
    if (tranId && (status === "VALID" || status === "VALIDATED")) {
      const v = await validatePayment(valId);
      if (v.ok) await activatePayment(tranId, valId);
    }
  } catch {
    // fall through to redirect
  }
  return NextResponse.redirect(new URL("/billing?paid=1", SITE_URL), 303);
}
