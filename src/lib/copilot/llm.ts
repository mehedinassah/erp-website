import "server-only";
import { SYSTEM_PROMPT } from "./prompt";
import { TOOL_SCHEMAS, runTool } from "./tools";

// Groq is OpenAI-compatible. gpt-oss-120b does structured tool-calling reliably
// (the Llama models on Groq often emit malformed tool calls).
const BASE = (process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
const MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const MAX_TURNS = 5;

export type ChatMessage = { role: "user" | "assistant"; content: string };

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
type LLMMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

export type CopilotResult = { reply: string; error?: string };

/**
 * Some models (esp. Llama on Groq) occasionally emit a tool call as text like
 *   <function=get_sales_summary{"period":"this_month"}</function>
 * which Groq rejects with a 400 `tool_use_failed`, echoing it in
 * `failed_generation`. Recover the intended call(s) so we can still answer.
 */
function salvageToolCalls(errorBody: string): { name: string; args: Record<string, unknown> }[] {
  let failed = "";
  try {
    failed = JSON.parse(errorBody)?.error?.failed_generation ?? "";
  } catch {
    failed = errorBody;
  }
  if (!failed) return [];
  const calls: { name: string; args: Record<string, unknown> }[] = [];
  const re = /<function=([a-zA-Z_]\w*)\s*>?\s*(\{[\s\S]*?\})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(failed)) !== null) {
    let args: Record<string, unknown> = {};
    try { args = JSON.parse(m[2]); } catch { /* leave empty */ }
    calls.push({ name: m[1], args });
  }
  if (calls.length === 0) {
    const re2 = /<function=([a-zA-Z_]\w*)\s*>?\s*<\/function>/g;
    while ((m = re2.exec(failed)) !== null) calls.push({ name: m[1], args: {} });
  }
  return calls;
}

async function callModel(messages: LLMMessage[], key: string): Promise<Response> {
  return fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOL_SCHEMAS,
      tool_choice: "auto",
      temperature: 0.3,
      max_tokens: 900,
    }),
    cache: "no-store",
  });
}

async function executeCalls(calls: { id: string; name: string; args: Record<string, unknown> }[], tenantId: string, messages: LLMMessage[]) {
  for (const c of calls) {
    let result: unknown;
    try {
      result = await runTool(c.name, c.args, tenantId);
    } catch (e) {
      result = { error: e instanceof Error ? e.message : "tool failed" };
    }
    messages.push({ role: "tool", tool_call_id: c.id, content: JSON.stringify(result) });
  }
}

export async function runCopilot(history: ChatMessage[], tenantId: string): Promise<CopilotResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return { reply: "The assistant isn't fully set up yet. Please try again later.", error: "GROQ_API_KEY missing" };
  }

  const messages: LLMMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    let res: Response;
    try {
      res = await callModel(messages, key);
    } catch {
      return { reply: "I couldn't reach the assistant service. Please try again in a moment.", error: "fetch failed" };
    }

    if (!res.ok) {
      const body = await res.text().catch(() => `${res.status}`);
      // Attempt to recover a malformed tool call before giving up.
      const salvaged = salvageToolCalls(body);
      if (salvaged.length > 0) {
        const calls: ToolCall[] = salvaged.map((s, i) => ({
          id: `salvage_${turn}_${i}`, type: "function",
          function: { name: s.name, arguments: JSON.stringify(s.args) },
        }));
        messages.push({ role: "assistant", content: null, tool_calls: calls });
        await executeCalls(salvaged.map((s, i) => ({ id: calls[i].id, name: s.name, args: s.args })), tenantId, messages);
        continue;
      }
      return { reply: "The assistant had a problem answering. Please try again.", error: `LLM ${res.status}: ${body.slice(0, 300)}` };
    }

    const data = await res.json();
    const msg = data?.choices?.[0]?.message as LLMMessage | undefined;
    if (!msg) return { reply: "Sorry, I didn't get a response. Please try again." };

    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { reply: (msg.content ?? "").trim() || "I'm not sure how to answer that. Could you rephrase?" };
    }

    await executeCalls(
      msg.tool_calls.map((c) => ({ id: c.id, name: c.function.name, args: safeParse(c.function.arguments) })),
      tenantId,
      messages,
    );
  }

  return { reply: "That took too many steps to work out. Please try asking in a simpler way." };
}

function safeParse(s: string): Record<string, unknown> {
  try { return s ? JSON.parse(s) : {}; } catch { return {}; }
}
