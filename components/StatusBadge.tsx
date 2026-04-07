"use client";

import { cn } from "@/lib/utils";
import { StatusColor } from "@/types";

interface StatusBadgeProps {
  status: StatusColor;
  label?: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

const statusConfig: Record<
  StatusColor,
  { label: string; classes: string; dot: string; glow: string }
> = {
  approved: {
    label: "Approved",
    classes: "bg-green-500/15 text-green-400 border-green-500/30",
    dot: "bg-green-400",
    glow: "shadow-green-500/20",
  },
  pending: {
    label: "Pending",
    classes: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  rfe: {
    label: "RFE",
    classes: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    dot: "bg-orange-400",
    glow: "shadow-orange-500/20",
  },
  denied: {
    label: "Denied",
    classes: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-400",
    glow: "shadow-red-500/20",
  },
  unknown: {
    label: "Unknown",
    classes: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
    dot: "bg-zinc-400",
    glow: "shadow-zinc-500/20",
  },
};

const sizeClasses = {
  sm: "text-xs px-2 py-0.5 gap-1.5",
  md: "text-xs px-2.5 py-1 gap-2",
  lg: "text-sm px-3 py-1.5 gap-2",
};

export function StatusBadge({
  status,
  label,
  size = "md",
  pulse,
  className,
}: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.unknown;
  const displayLabel = label || config.label;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium shadow",
        config.classes,
        config.glow,
        sizeClasses[size],
        className
      )}
      aria-label={`Status: ${displayLabel}`}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          config.dot,
          pulse && status !== "approved" && status !== "denied" && "animate-pulse"
        )}
        aria-hidden
      />
      {displayLabel}
    </span>
  );
}
