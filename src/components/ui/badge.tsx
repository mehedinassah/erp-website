import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-border bg-muted text-muted-foreground",
        gold: "border-accent/30 bg-accent-soft text-accent",
        success:
          "border-success/25 bg-success/10 text-success",
        warning:
          "border-warning/25 bg-warning/10 text-warning",
        danger:
          "border-destructive/25 bg-destructive/10 text-destructive",
        info: "border-info/25 bg-info/10 text-info",
        solid: "border-transparent bg-primary text-primary-foreground",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props} />
  );
}

// Map domain statuses to a badge tone for consistency across the app.
export function statusTone(
  status: string,
): NonNullable<BadgeProps["tone"]> {
  switch (status) {
    case "RECEIVED":
    case "FULFILLED":
    case "CONFIRMED":
    case "ACTIVE":
      return "success";
    case "PARTIAL":
    case "ORDERED":
      return "info";
    case "DRAFT":
      return "neutral";
    case "CANCELLED":
    case "ARCHIVED":
      return "danger";
    default:
      return "neutral";
  }
}
