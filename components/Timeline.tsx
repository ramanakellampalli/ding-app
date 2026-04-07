"use client";

import { motion } from "framer-motion";
import { CaseHistoryEntry, StatusColor } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { GitCommitHorizontal } from "lucide-react";

interface TimelineProps {
  history: CaseHistoryEntry[];
}

export function Timeline({ history }: TimelineProps) {
  const entries = [...history].reverse(); // newest first

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <GitCommitHorizontal className="h-10 w-10 mx-auto text-[var(--muted-foreground)] mb-3" />
        <p className="text-[var(--muted-foreground)] text-sm">No history yet</p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1 opacity-70">
          Status changes will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-px bg-[var(--card-border)]" aria-hidden />

      <div className="space-y-0">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className="relative flex gap-5 pb-6 last:pb-0"
          >
            {/* Dot */}
            <div className="relative z-10 mt-1 shrink-0">
              <TimelineDot color={entry.color} isFirst={i === 0} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <StatusBadge status={entry.color} size="sm" />
                <span className="text-xs text-[var(--muted-foreground)]">
                  {formatDateTime(entry.recordedAt)}
                </span>
              </div>
              <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
                {entry.title}
              </p>
              {entry.description && (
                <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">
                  {entry.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TimelineDot({
  color,
  isFirst,
}: {
  color: StatusColor;
  isFirst: boolean;
}) {
  const dotColors: Record<StatusColor, string> = {
    approved: "bg-green-400 border-green-500/30",
    pending: "bg-yellow-400 border-yellow-500/30",
    rfe: "bg-orange-400 border-orange-500/30",
    denied: "bg-red-400 border-red-500/30",
    unknown: "bg-zinc-500 border-zinc-500/30",
  };

  return (
    <div
      className={`h-8 w-8 rounded-full flex items-center justify-center border-2 bg-[var(--card-bg)] ${
        isFirst ? dotColors[color] : "border-[var(--card-border)]"
      }`}
    >
      <div
        className={`h-2.5 w-2.5 rounded-full ${
          isFirst
            ? "bg-white"
            : {
                approved: "bg-green-400",
                pending: "bg-yellow-400",
                rfe: "bg-orange-400",
                denied: "bg-red-400",
                unknown: "bg-zinc-500",
              }[color]
        }`}
      />
    </div>
  );
}
