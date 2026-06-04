import { type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: "default" | "gold" | "danger" | "success";
  delay?: number;
}) {
  const iconTone = {
    default: "bg-muted text-muted-foreground",
    gold: "bg-accent-soft text-accent",
    danger: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  }[tone];

  return (
    <Card
      className="animate-rise p-4 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
          <p className="tabular mt-1.5 truncate font-display text-xl font-semibold tracking-tight sm:mt-2 sm:text-2xl">
            {value}
          </p>
          {hint && (
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {hint}
            </p>
          )}
        </div>
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg",
            iconTone,
          )}
        >
          <Icon className="size-5" />
        </span>
      </div>
    </Card>
  );
}
