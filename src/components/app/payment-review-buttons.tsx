"use client";

import { useTransition } from "react";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { approvePayment, rejectPayment } from "@/app/(app)/admin/payment-actions";

export function PaymentReviewButtons({ paymentId }: { paymentId: string }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-end gap-2">
      <Button variant="gold" size="sm" disabled={pending} onClick={() => start(() => approvePayment(paymentId))}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
      </Button>
      <Button variant="outline" size="sm" disabled={pending} onClick={() => start(() => rejectPayment(paymentId))}>
        <X className="size-4" /> Reject
      </Button>
    </div>
  );
}
