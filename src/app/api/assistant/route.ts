import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planHasAISupport } from "@/lib/plans";
import { runCopilot, type ChatMessage } from "@/lib/copilot/llm";

export const dynamic = "force-dynamic";

// Best-effort per-tenant daily cap (in-memory; resets on cold start). Guards
// against runaway LLM cost without needing a table.
const DAILY_CAP = 100;
const usage = new Map<string, { day: string; count: number }>();
function allow(tenantId: string): boolean {
  const day = new Date().toISOString().slice(0, 10);
  const u = usage.get(tenantId);
  if (!u || u.day !== day) {
    usage.set(tenantId, { day, count: 1 });
    return true;
  }
  if (u.count >= DAILY_CAP) return false;
  u.count++;
  return true;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }

  // PRO-only feature.
  let plan = "TRIAL";
  try {
    const t = await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { plan: true } });
    plan = t?.plan ?? "TRIAL";
  } catch {
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 503 });
  }
  if (!planHasAISupport(plan)) {
    return NextResponse.json({ error: "Perico Copilot is available on the Pro plan." }, { status: 403 });
  }

  if (!allow(session.tenantId)) {
    return NextResponse.json({ error: "You've reached today's assistant limit. Please try again tomorrow." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const raw = body?.messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  // Sanitize + cap history.
  const history: ChatMessage[] = raw
    .filter((m: unknown): m is ChatMessage =>
      !!m && typeof (m as ChatMessage).content === "string" &&
      ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant"))
    .slice(-12)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }));

  if (history.length === 0) {
    return NextResponse.json({ error: "No message provided." }, { status: 400 });
  }

  const { reply, error } = await runCopilot(history, session.tenantId);
  if (error) console.error("Copilot error:", error);
  return NextResponse.json({ reply });
}
