import "server-only";
import { SYSTEM_PROMPT } from "./prompt";
import { TOOL_SCHEMAS, runTool } from "./tools";

// Groq is OpenAI-compatible. Reuse the same key/model as the Helpdesk service.
const BASE = (process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1").replace(/\/$/, "");
const MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const MAX_TURNS = 5;

export type ChatMessage = { role: "user" | "assistant"; content: string };

type LLMMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

export type CopilotResult = { reply: string; error?: string };

/**
 * Run the copilot: a bounded tool-calling loop. The model may call read-only,
 * tenant-scoped tools; we execute them server-side and feed results back until
 * it produces a final answer.
 */
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
      res = await fetch(`${BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: MODEL,
          messages,
          tools: TOOL_SCHEMAS,
          tool_choice: "auto",
          temperature: 0.3,
          max_tokens: 800,
        }),
        cache: "no-store",
      });
    } catch {
      return { reply: "I couldn't reach the assistant service. Please try again in a moment.", error: "fetch failed" };
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => `${res.status}`);
      return { reply: "The assistant had a problem answering. Please try again.", error: `LLM ${res.status}: ${detail.slice(0, 300)}` };
    }

    const data = await res.json();
    const msg = data?.choices?.[0]?.message as LLMMessage | undefined;
    if (!msg) return { reply: "Sorry, I didn't get a response. Please try again." };

    // Push the assistant turn (may include tool calls).
    messages.push({ role: "assistant", content: msg.content ?? null, tool_calls: msg.tool_calls });

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      return { reply: (msg.content ?? "").trim() || "I'm not sure how to answer that. Could you rephrase?" };
    }

    // Execute each requested tool (scoped to this tenant) and feed results back.
    for (const call of msg.tool_calls) {
      let result: unknown;
      try {
        const parsed = call.function.arguments ? JSON.parse(call.function.arguments) : {};
        result = await runTool(call.function.name, parsed, tenantId);
      } catch (e) {
        result = { error: e instanceof Error ? e.message : "tool failed" };
      }
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  return { reply: "That took too many steps to work out. Please try asking in a simpler way." };
}
