"use client";

import { motion } from "framer-motion";
import { Clock, RefreshCw, Trash2, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";
import { USCISCase } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { timeAgo, canRefresh, nextRefreshIn, cn } from "@/lib/utils";

interface CaseCardProps {
  caseData: USCISCase;
  onDelete?: (id: string) => void;
  onRefresh?: (id: string) => void;
  refreshing?: boolean;
  index?: number;
}

export function CaseCard({
  caseData,
  onDelete,
  onRefresh,
  refreshing,
  index = 0,
}: CaseCardProps) {
  const refreshable = canRefresh(caseData.lastRefreshed);
  const cooldown = nextRefreshIn(caseData.lastRefreshed);
  const color = caseData.currentStatus.color;

  const borderGlow = {
    approved: "hover:border-green-500/40 hover:shadow-green-500/10",
    pending: "hover:border-yellow-500/40 hover:shadow-yellow-500/10",
    rfe: "hover:border-orange-500/40 hover:shadow-orange-500/10",
    denied: "hover:border-red-500/40 hover:shadow-red-500/10",
    unknown: "hover:border-indigo-500/40 hover:shadow-indigo-500/10",
  }[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
    >
      <div
        className={cn(
          "group relative rounded-2xl border p-5 transition-all duration-200",
          "bg-[var(--card-bg)] border-[var(--card-border)]",
          "hover:shadow-xl",
          borderGlow
        )}
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {caseData.nickname && (
                <span className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] font-medium">
                  <Tag className="h-3 w-3" aria-hidden />
                  {caseData.nickname}
                </span>
              )}
              <StatusBadge status={color} pulse size="sm" />
            </div>
            <h3 className="mt-1.5 font-mono text-sm font-semibold text-[var(--foreground)] tracking-wide">
              {caseData.receiptNumber}
            </h3>
            {caseData.formType && (
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                {caseData.formType}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onRefresh?.(caseData.id)}
              disabled={!refreshable || refreshing}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                refreshable && !refreshing
                  ? "text-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300"
                  : "text-[var(--muted-foreground)] cursor-not-allowed opacity-50"
              )}
              aria-label={
                refreshing
                  ? "Refreshing…"
                  : refreshable
                  ? "Refresh case status"
                  : `Next refresh in ${cooldown}`
              }
              title={!refreshable ? `Refresh available in ${cooldown}` : undefined}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", refreshing && "animate-spin")}
                aria-hidden
              />
              {refreshing ? "…" : !refreshable ? cooldown : ""}
            </button>
            <button
              onClick={() => onDelete?.(caseData.id)}
              className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 transition-all"
              aria-label="Remove case"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>

        {/* Status */}
        <div className="rounded-xl bg-[var(--muted)] px-3.5 py-3 mb-4">
          <p className="text-sm font-medium text-[var(--foreground)] leading-snug">
            {caseData.currentStatus.title}
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2 leading-relaxed">
            {caseData.currentStatus.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-[var(--muted-foreground)]">
            <Clock className="h-3 w-3" aria-hidden />
            <span>Updated {timeAgo(caseData.lastChecked)}</span>
          </div>
          <Link
            href={`/cases/${caseData.id}`}
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            aria-label={`View details for ${caseData.receiptNumber}`}
          >
            View history
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function CaseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-3 w-24" />
        </div>
        <div className="skeleton h-7 w-16" />
      </div>
      <div className="skeleton h-16 w-full mb-4" />
      <div className="flex justify-between">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-3 w-20" />
      </div>
    </div>
  );
}
