// SMS gateway integration (Bangladesh). Configure via env vars (Vercel + .env):
//   SMS_API_URL = https://bulksmsbd.net/api/smsapi   (or your provider's endpoint)
//   SMS_API_KEY = your api key
//   SMS_SENDER  = your approved sender ID
// Uses the common bulksmsbd-style GET API. If unset, SMS sending is disabled
// and the app falls back to WhatsApp/SMS deep links.

export function smsConfigured(): boolean {
  return Boolean(process.env.SMS_API_URL && process.env.SMS_API_KEY && process.env.SMS_SENDER);
}

/** Normalise a BD phone number to the gateway's expected 880XXXXXXXXXX form. */
export function normalizeBdPhone(phone: string): string {
  let d = phone.replace(/[^0-9]/g, "");
  if (d.startsWith("0")) d = "88" + d; // 01XXXXXXXXX -> 8801XXXXXXXXX
  else if (d.startsWith("1") && d.length === 10) d = "880" + d;
  else if (!d.startsWith("880") && d.startsWith("88")) d = d;
  return d;
}

export async function sendSMS(to: string, message: string): Promise<{ ok: boolean; error?: string }> {
  if (!smsConfigured()) return { ok: false, error: "SMS is not configured." };
  const number = normalizeBdPhone(to);
  if (!number) return { ok: false, error: "Invalid phone number." };

  const url = new URL(process.env.SMS_API_URL!);
  url.searchParams.set("api_key", process.env.SMS_API_KEY!);
  url.searchParams.set("type", "text");
  url.searchParams.set("senderid", process.env.SMS_SENDER!);
  url.searchParams.set("number", number);
  url.searchParams.set("message", message);

  try {
    const res = await fetch(url.toString(), { method: "GET" });
    const body = await res.text();
    // bulksmsbd returns a JSON/string; treat HTTP 200 + no obvious error as success
    if (!res.ok) return { ok: false, error: `Gateway error (${res.status})` };
    if (/error|invalid|fail/i.test(body) && !/success|1001|smsbody/i.test(body)) {
      return { ok: false, error: body.slice(0, 140) };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "SMS send failed." };
  }
}
