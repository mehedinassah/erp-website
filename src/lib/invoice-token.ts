import { createHmac } from "crypto";

// Deterministic, unguessable token for public invoice links — derived from the
// order id + AUTH_SECRET, so no DB column is needed. Lets a customer open their
// invoice without logging in, while keeping other orders private.

function secret() {
  return process.env.AUTH_SECRET ?? "perico-fallback-secret-change-me";
}

export function makeInvoiceToken(orderId: string): string {
  return createHmac("sha256", secret()).update(orderId).digest("hex").slice(0, 24);
}

export function verifyInvoiceToken(orderId: string, token: string): boolean {
  if (!token) return false;
  const expected = makeInvoiceToken(orderId);
  // constant-ish time compare
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}
