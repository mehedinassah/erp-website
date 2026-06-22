"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { enableAISupport } from "@/app/(app)/ai-support/actions";
import { Button } from "@/components/ui/button";

export function EnableAISupportButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function onEnable() {
    setError("");
    startTransition(async () => {
      const res = await enableAISupport();
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Button onClick={onEnable} disabled={pending} size="lg">
        <Sparkles className="size-4" />
        {pending ? "Setting up…" : "Enable AI Support"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
