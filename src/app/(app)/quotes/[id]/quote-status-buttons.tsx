"use client";

import { useTransition } from "react";
import { updateQuoteStatus } from "../actions";
import { Button } from "@/components/ui/button";

const TRANSITIONS: Record<string, { label: string; next: string; variant: "gold" | "outline" | "ghost" }[]> = {
  DRAFT: [{ label: "Mark as sent", next: "SENT", variant: "gold" }],
  SENT: [
    { label: "Mark accepted", next: "ACCEPTED", variant: "gold" },
    { label: "Mark declined", next: "DECLINED", variant: "outline" },
    { label: "Mark expired", next: "EXPIRED", variant: "ghost" },
  ],
  ACCEPTED: [],
  DECLINED: [],
  EXPIRED: [],
};

export function QuoteStatusButtons({
  quoteId,
  currentStatus,
  tenantId,
  userId,
}: {
  quoteId: string;
  currentStatus: string;
  tenantId: string;
  userId: string;
}) {
  const [pending, startTransition] = useTransition();
  const transitions = TRANSITIONS[currentStatus] ?? [];

  if (transitions.length === 0) return null;

  return (
    <>
      {transitions.map((t) => (
        <Button
          key={t.next}
          variant={t.variant}
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => updateQuoteStatus(quoteId, t.next, tenantId, userId))}
        >
          {t.label}
        </Button>
      ))}
    </>
  );
}
