"use client";

import { useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { sendSmsReminder, sendAllDueReminders } from "@/app/(app)/ledger/sms-actions";

/** Send a gateway SMS reminder to a single account. */
export function SendSmsButton({ accountId }: { accountId: string }) {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await sendSmsReminder(accountId);
          toast(r.ok ? { title: "SMS sent", variant: "success" } : { title: r.error ?? "Failed to send", variant: "error" });
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4 text-accent" />} Send SMS now
    </Button>
  );
}

/** Blast reminders to all overdue receivable accounts. */
export function SendAllSmsButton() {
  const [pending, start] = useTransition();
  const toast = useToast();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await sendAllDueReminders();
          if (!r.ok) toast({ title: r.error ?? "Failed", variant: "error" });
          else toast({ title: `Reminders sent: ${r.sent}${r.failed ? `, failed: ${r.failed}` : ""}`, variant: r.failed ? "info" : "success" });
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} SMS all overdue
    </Button>
  );
}
