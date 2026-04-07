"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color: "indigo" | "green" | "yellow" | "red" | "orange";
  index?: number;
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    icon: "text-indigo-400",
    value: "text-indigo-400",
    border: "border-indigo-500/20",
    glow: "hover:shadow-indigo-500/10",
  },
  green: {
    bg: "bg-green-500/10",
    icon: "text-green-400",
    value: "text-green-400",
    border: "border-green-500/20",
    glow: "hover:shadow-green-500/10",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    icon: "text-yellow-400",
    value: "text-yellow-400",
    border: "border-yellow-500/20",
    glow: "hover:shadow-yellow-500/10",
  },
  red: {
    bg: "bg-red-500/10",
    icon: "text-red-400",
    value: "text-red-400",
    border: "border-red-500/20",
    glow: "hover:shadow-red-500/10",
  },
  orange: {
    bg: "bg-orange-500/10",
    icon: "text-orange-400",
    value: "text-orange-400",
    border: "border-orange-500/20",
    glow: "hover:shadow-orange-500/10",
  },
};

export function StatsCard({ label, value, icon: Icon, color, index = 0 }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={cn(
        "rounded-2xl border p-5 transition-all duration-200 hover:shadow-xl",
        "bg-[var(--card-bg)]",
        c.border,
        c.glow
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-widest">
            {label}
          </p>
          <p className={cn("mt-2 text-3xl font-bold tabular-nums", c.value)}>
            {value}
          </p>
        </div>
        <div className={cn("rounded-xl p-2.5", c.bg)}>
          <Icon className={cn("h-5 w-5", c.icon)} aria-hidden />
        </div>
      </div>
    </motion.div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton h-3 w-16" />
          <div className="skeleton h-8 w-12" />
        </div>
        <div className="skeleton h-10 w-10 rounded-xl" />
      </div>
    </div>
  );
}
