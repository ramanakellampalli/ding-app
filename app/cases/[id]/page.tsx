"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Tag,
  Clock,
  GitBranch,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { StatusBadge } from "@/components/StatusBadge";
import { Timeline } from "@/components/Timeline";
import { USCISCase } from "@/types";
import { formatDateTime, timeAgo, canRefresh, nextRefreshIn, cn } from "@/lib/utils";

export default function CaseDetailPage() {
  return (
    <ProtectedRoute>
      <CaseDetail />
    </ProtectedRoute>
  );
}

function CaseDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [caseData, setCaseData] = useState<USCISCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCase = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/cases", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const found = data.cases?.find((c: USCISCase) => c.id === params.id);
      if (!found) {
        router.replace("/dashboard");
        return;
      }
      setCaseData(found);
    } catch {
      toastError("Failed to load case");
    } finally {
      setLoading(false);
    }
  }, [user, params.id, router, toastError]);

  useEffect(() => {
    fetchCase();
  }, [fetchCase]);

  const handleRefresh = async () => {
    if (!user || !caseData) return;
    setRefreshing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/cases/${params.id}`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          info("Rate limited", data.error);
        } else {
          toastError("Refresh failed", data.error);
        }
        return;
      }
      setCaseData((prev) =>
        prev
          ? {
              ...prev,
              currentStatus: data.status,
              lastRefreshed: data.lastRefreshed,
              lastChecked: data.lastRefreshed,
              history: data.statusChanged
                ? [
                    ...prev.history,
                    {
                      id: crypto.randomUUID(),
                      title: data.status.title,
                      description: data.status.description,
                      color: data.status.color,
                      recordedAt: data.lastRefreshed,
                    },
                  ]
                : prev.history,
            }
          : null
      );
      if (data.statusChanged) {
        success("Status updated!", data.status.title);
      } else {
        info("No change", "Status is unchanged.");
      }
    } catch {
      toastError("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) return <LoadingSkeleton />;
  if (!caseData) return null;

  const refreshable = canRefresh(caseData.lastRefreshed);
  const cooldown = nextRefreshIn(caseData.lastRefreshed);
  const color = caseData.currentStatus.color;

  return (
    <div className="min-h-screen bg-[var(--background)] gradient-mesh">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Dashboard
        </Link>

        {/* Header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 mb-6"
        >
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {caseData.nickname && (
                <div className="flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] mb-1.5">
                  <Tag className="h-3.5 w-3.5" aria-hidden />
                  {caseData.nickname}
                </div>
              )}
              <h1 className="font-mono text-xl font-bold text-[var(--foreground)] tracking-wide">
                {caseData.receiptNumber}
              </h1>
              <div className="flex items-center flex-wrap gap-2 mt-2">
                <StatusBadge status={color} pulse size="md" />
                {caseData.formType && (
                  <span className="text-xs text-[var(--muted-foreground)]">
                    {caseData.formType}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={!refreshable || refreshing}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                refreshable && !refreshing
                  ? "bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 border border-indigo-500/30"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)] border border-[var(--card-border)] cursor-not-allowed opacity-60"
              )}
              aria-label={refreshing ? "Refreshing" : refreshable ? "Refresh status" : `Wait ${cooldown}`}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              {refreshing ? "Checking…" : refreshable ? "Refresh" : `Wait ${cooldown}`}
            </button>
          </div>

          {/* Current status detail */}
          <div className="mt-5 rounded-xl bg-[var(--muted)] p-4">
            <p className="font-medium text-[var(--foreground)] mb-1">
              {caseData.currentStatus.title}
            </p>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
              {caseData.currentStatus.description}
            </p>
          </div>

          {/* Meta info */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetaItem icon={Clock} label="Last checked" value={timeAgo(caseData.lastChecked)} />
            <MetaItem icon={Calendar} label="Added" value={formatDateTime(caseData.createdAt)} />
            <MetaItem
              icon={GitBranch}
              label="Status changes"
              value={`${Math.max(0, caseData.history.length - 1)} update${caseData.history.length !== 2 ? "s" : ""}`}
            />
          </div>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6"
        >
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-indigo-400" aria-hidden />
            Case History
          </h2>
          <Timeline history={caseData.history} />
        </motion.div>
      </main>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--muted)]">
        <Icon className="h-3.5 w-3.5 text-[var(--muted-foreground)]" aria-hidden />
      </div>
      <div>
        <p className="text-xs text-[var(--muted-foreground)]">{label}</p>
        <p className="text-xs font-medium text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] gradient-mesh">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
        <div className="skeleton h-5 w-32 mb-6" />
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 mb-6">
          <div className="space-y-3">
            <div className="skeleton h-4 w-24" />
            <div className="skeleton h-7 w-40" />
            <div className="skeleton h-5 w-20" />
            <div className="skeleton h-20 w-full" />
          </div>
        </div>
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
          <div className="skeleton h-5 w-28 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-3 w-32" />
                  <div className="skeleton h-4 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
