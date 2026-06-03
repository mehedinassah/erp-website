"use client";

import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Due-reminder concept UI using real click-to-chat deep links:
 * WhatsApp (wa.me) and SMS (sms:) with a prefilled message. No backend needed.
 */
export function ReminderButtons({
  phone,
  message,
}: {
  phone: string | null;
  message: string;
}) {
  if (!phone) return null;
  const digits = phone.replace(/[^0-9]/g, "");
  const wa = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
  const sms = `sms:${phone}?&body=${encodeURIComponent(message)}`;

  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <a href={wa} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4 text-success" /> WhatsApp
        </a>
      </Button>
      <Button asChild variant="outline" size="sm">
        <a href={sms}>
          <Phone className="size-4" /> SMS
        </a>
      </Button>
    </div>
  );
}
