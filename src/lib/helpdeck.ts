import "server-only";

/**
 * Server-side client for the Helpdeck RAG service (separate Python microservice).
 *
 * - Tenant provisioning uses the shared PLATFORM key (X-Platform-Key).
 * - Per-tenant document/usage calls use that tenant's own API key.
 *
 * The Helpdeck API key is created and used ONLY on the server and is never sent
 * to the browser (more secure than Helpdeck's own standalone dashboard).
 */

const BASE = (process.env.HELPDECK_API_URL ?? "http://localhost:8001").replace(/\/$/, "");
const PLATFORM_KEY = process.env.HELPDECK_PLATFORM_KEY ?? "";

export type HelpdeckTenant = {
  id: string;
  name: string;
  api_key: string;
  plan: string;
  message_limit: number;
  source: string;
};

export type HelpdeckDocument = {
  id: string;
  title: string;
  source: string;
  status: string;
  chunk_count: number;
  created_at: string;
};

export type HelpdeckUsage = {
  plan: string;
  message_limit: number;
  messages_used: number;
  messages_remaining: number;
};

async function parse<T>(res: Response, action: string): Promise<T> {
  if (!res.ok) {
    let detail = `${res.status}`;
    try {
      detail = (await res.json())?.detail ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(`Helpdeck ${action} failed: ${detail}`);
  }
  return res.json() as Promise<T>;
}

/** Provision a new Helpdeck tenant for a Perico business (PRO plan). */
export async function provisionTenant(name: string): Promise<HelpdeckTenant> {
  const res = await fetch(`${BASE}/api/platform/tenants`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Platform-Key": PLATFORM_KEY },
    body: JSON.stringify({ name, plan: "pro", message_limit: 2000, source: "perico" }),
    cache: "no-store",
  });
  return parse<HelpdeckTenant>(res, "provisionTenant");
}

function authHeaders(apiKey: string): HeadersInit {
  return { "Content-Type": "application/json", "X-API-Key": apiKey };
}

export async function listDocuments(apiKey: string): Promise<HelpdeckDocument[]> {
  const res = await fetch(`${BASE}/api/documents`, {
    headers: authHeaders(apiKey),
    cache: "no-store",
  });
  return parse<HelpdeckDocument[]>(res, "listDocuments");
}

export async function addTextDocument(
  apiKey: string,
  title: string,
  content: string
): Promise<HelpdeckDocument> {
  const res = await fetch(`${BASE}/api/documents`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: JSON.stringify({ title, content }),
    cache: "no-store",
  });
  return parse<HelpdeckDocument>(res, "addTextDocument");
}

export async function uploadDocument(apiKey: string, file: File): Promise<HelpdeckDocument> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${BASE}/api/documents/upload`, {
    method: "POST",
    headers: { "X-API-Key": apiKey },
    body: form,
    cache: "no-store",
  });
  return parse<HelpdeckDocument>(res, "uploadDocument");
}

export async function deleteDocument(apiKey: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/documents/${id}`, {
    method: "DELETE",
    headers: authHeaders(apiKey),
    cache: "no-store",
  });
  await parse<unknown>(res, "deleteDocument");
}

export async function getUsage(apiKey: string): Promise<HelpdeckUsage> {
  const res = await fetch(`${BASE}/api/usage`, {
    headers: authHeaders(apiKey),
    cache: "no-store",
  });
  return parse<HelpdeckUsage>(res, "getUsage");
}

/** Public base URL used in the embed snippet shown to the customer. */
export function helpdeckPublicUrl(): string {
  return process.env.NEXT_PUBLIC_HELPDECK_URL ?? BASE;
}
