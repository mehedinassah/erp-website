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
      {/* Icon + label on top row */}
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg sm:size-9",
            iconTone,
          )}
        >
          <Icon className="size-4 sm:size-[18px]" />
        </span>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
      </div>

      {/* Value gets the full card width — never clipped */}
      <p className="tabular mt-3 font-display text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
        {value}
      </p>
      {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
