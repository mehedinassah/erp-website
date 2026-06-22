"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Upload, Copy, Check, MessageSquareText } from "lucide-react";
import { addTextDoc, uploadDoc, removeDoc } from "@/app/(app)/ai-support/actions";
import type { HelpdeckDocument, HelpdeckUsage } from "@/lib/helpdeck";
import type { ActionState } from "@/lib/validation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const EMPTY: ActionState = {};

export function AiSupportManager({
  documents,
  usage,
  snippet,
}: {
  documents: HelpdeckDocument[];
  usage: HelpdeckUsage;
  snippet: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [addState, addAction] = useActionState(addTextDoc, EMPTY);
  const [uploadState, uploadAction] = useActionState(uploadDoc, EMPTY);

  useEffect(() => {
    if (addState.ok) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [addState, router]);

  useEffect(() => {
    if (uploadState.ok) router.refresh();
  }, [uploadState, router]);

  function copySnippet() {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await removeDoc(id);
      router.refresh();
    });
  }

  const pct = Math.min(100, Math.round((usage.messages_used / usage.message_limit) * 100));

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Add knowledge */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge base ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form ref={formRef} action={addAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Document title</Label>
                <Input id="title" name="title" placeholder="e.g. Refund policy" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  name="content"
                  rows={4}
                  placeholder="Paste an FAQ, policy, or any text the assistant should know…"
                  className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
              {addState.error && <p className="text-sm text-destructive">{addState.error}</p>}
              <Button type="submit">Add to knowledge base</Button>
            </form>

            <div className="hairline border-t pt-4">
              <form action={uploadAction} className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  name="file"
                  accept=".txt,.md,.pdf"
                  className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted"
                />
                <Button type="submit" variant="outline" size="sm">
                  <Upload className="size-4" /> Upload .txt / .md / .pdf
                </Button>
                {uploadState.error && (
                  <p className="w-full text-sm text-destructive">{uploadState.error}</p>
                )}
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Document list */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No documents yet. Add one above to give your assistant knowledge.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.source} · {d.chunk_count} chunks · {d.status}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(d.id)}
                      disabled={pending}
                      aria-label={`Delete ${d.title}`}
                    >
                      <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar: usage + embed */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Usage</CardTitle>
            <Badge tone="success" className="capitalize">
              {usage.plan}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl font-semibold">{usage.messages_used}</span>
              <span className="text-sm text-muted-foreground">/ {usage.message_limit} messages</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {usage.messages_remaining} messages remaining this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Embed on your site</CardTitle>
            <Button variant="outline" size="sm" onClick={copySnippet}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-muted-foreground">
              Paste this before <code className="rounded bg-muted px-1">&lt;/body&gt;</code> on your
              website. The chat bubble appears in the corner.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-foreground/95 p-3 text-[11px] leading-relaxed text-background">
              <code>{snippet}</code>
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-3 pt-6">
            <span className="grid size-9 shrink-0 place-items-center rounded-md bg-accent-soft text-accent">
              <MessageSquareText className="size-4" />
            </span>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Your assistant answers only from the documents above. Add your FAQs, policies, and
              product info for the best results.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
