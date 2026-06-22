import Link from "next/link";
import { notFound } from "next/navigation";
import { Bot, Sparkles, Lock, MessageSquareText, FileText, Zap } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { planHasAISupport, PLANS } from "@/lib/plans";
import { listDocuments, getUsage, getMe, helpdeckPublicUrl, type HelpdeckDocument, type HelpdeckUsage } from "@/lib/helpdeck";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiSupportManager } from "@/components/app/ai-support-manager";
import { EnableAISupportButton } from "@/components/app/ai-support-enable";

export const dynamic = "force-dynamic";

function buildSnippet(widgetKey: string, name: string): string {
  const url = helpdeckPublicUrl();
  return `<script
  src="${url}/widget/widget.js"
  data-widget-key="${widgetKey}"
  data-api-url="${url}"
  data-title="${name} Support"
  data-accent="#4f46e5">
</script>`;
}

export default async function AISupportPage() {
  const session = await requireRole(["ADMIN"]);
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { name: true, plan: true, helpdeckApiKey: true },
  });
  if (!tenant) notFound();

  const header = (
    <PageHeader
      eyebrow="Add-on"
      title="AI Customer Support"
      description="An AI chat widget for your website that answers customers from your own documents."
    />
  );

  // ── State 1: plan doesn't include AI Support → upsell ──────────────
  if (!planHasAISupport(tenant.plan)) {
    return (
      <div>
        {header}
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Lock className="size-6" />
            </span>
            <div className="max-w-md space-y-2">
              <h2 className="font-display text-xl font-semibold">
                Available on the {PLANS.PRO.name} plan
              </h2>
              <p className="text-sm text-muted-foreground">
                Upgrade to {PLANS.PRO.name} to add an AI customer-support widget to your website.
                Upload your FAQs and policies, and let the assistant answer visitors 24/7.
              </p>
            </div>
            <div className="grid w-full max-w-lg gap-3 sm:grid-cols-3">
              {[
                { icon: FileText, label: "Upload your docs" },
                { icon: MessageSquareText, label: "Embeddable chat widget" },
                { icon: Zap, label: "Answers from your data" },
              ].map((f) => (
                <div key={f.label} className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                  <f.icon className="mx-auto mb-1.5 size-4 text-accent" />
                  {f.label}
                </div>
              ))}
            </div>
            <Button asChild size="lg">
              <Link href="/billing">
                <Sparkles className="size-4" />
                Upgrade to {PLANS.PRO.name}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── State 2: PRO but not provisioned yet → enable ──────────────────
  if (!tenant.helpdeckApiKey) {
    return (
      <div>
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent-soft text-accent">
              <Bot className="size-6" />
            </span>
            <div className="max-w-md space-y-2">
              <h2 className="font-display text-xl font-semibold">Set up your AI assistant</h2>
              <p className="text-sm text-muted-foreground">
                Click below to create your AI support assistant. Then upload your FAQs and policies,
                and copy a one-line snippet onto your website.
              </p>
            </div>
            <EnableAISupportButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── State 3: provisioned → manage ──────────────────────────────────
  let documents: HelpdeckDocument[] = [];
  let usage: HelpdeckUsage = {
    plan: "pro",
    message_limit: 2000,
    messages_used: 0,
    messages_remaining: 2000,
  };
  let widgetKey = "";
  let loadError: string | null = null;
  try {
    const [docs, use, me] = await Promise.all([
      listDocuments(tenant.helpdeckApiKey),
      getUsage(tenant.helpdeckApiKey),
      getMe(tenant.helpdeckApiKey),
    ]);
    documents = docs;
    usage = use;
    widgetKey = me.widget_key ?? "";
  } catch (e) {
    loadError = (e as Error).message;
  }

  return (
    <div>
      {header}
      {loadError && (
        <div className="mb-6 rounded-md border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Could not reach the AI service: {loadError}
        </div>
      )}
      <AiSupportManager
        documents={documents}
        usage={usage}
        snippet={buildSnippet(widgetKey, tenant.name)}
      />
    </div>
  );
}
