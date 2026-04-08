"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  FolderOpen,
  LayoutDashboard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileStack,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { CaseCard, CaseCardSkeleton } from "@/components/CaseCard";
import { StatsCard, StatsCardSkeleton } from "@/components/StatsCard";
import { AddCaseModal } from "@/components/AddCaseModal";
import { USCISCase, StatusColor, DashboardStats } from "@/types";
import { canRefresh, cn } from "@/lib/utils";
import {
  getUserCases,
  addCase,
  deleteCaseById,
  updateCaseStatus,
  checkDuplicate,
} from "@/lib/cases";

type FilterStatus = "all" | StatusColor;

const FILTER_OPTIONS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "rfe", label: "RFE" },
  { value: "denied", label: "Denied" },
];

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [cases, setCases] = useState<USCISCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [refreshingId, setRefreshingId] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserCases(user.uid);
      setCases(data);
    } catch {
      toastError("Failed to load cases", "Please refresh the page.");
    } finally {
      setLoading(false);
    }
  }, [user, toastError]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const stats: DashboardStats = {
    total: cases.length,
    approved: cases.filter((c) => c.currentStatus.color === "approved").length,
    pending: cases.filter(
      (c) => c.currentStatus.color === "pending" || c.currentStatus.color === "unknown"
    ).length,
    needAttention: cases.filter(
      (c) => c.currentStatus.color === "rfe" || c.currentStatus.color === "denied"
    ).length,
  };

  const filtered = cases.filter((c) => {
    const matchSearch =
      !search ||
      c.receiptNumber.toLowerCase().includes(search.toLowerCase()) ||
      (c.nickname?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      (c.formType?.toLowerCase() ?? "").includes(search.toLowerCase()) ||
      c.currentStatus.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filterStatus === "all" || c.currentStatus.color === filterStatus;
    return matchSearch && matchFilter;
  });

  const handleAddCase = async (receiptNumber: string, nickname?: string) => {
    if (!user) return;

    const isDuplicate = await checkDuplicate(user.uid, receiptNumber);
    if (isDuplicate) throw new Error("You are already tracking this case.");

    // Fetch status via proxy API (no Admin SDK needed here)
    const res = await fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiptNumber }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to fetch status from USCIS.");

    const newCase = await addCase(user.uid, receiptNumber, nickname, data.status);
    setCases((prev) => [newCase, ...prev]);
    success(`Case ${receiptNumber} added!`, data.status.title);
  };

  const handleDelete = async (id: string) => {
    // Optimistic remove
    setCases((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCaseById(id);
      success("Case removed");
    } catch {
      fetchCases(); // revert on failure
      toastError("Failed to remove case");
    }
  };

  const handleRefresh = async (id: string) => {
    const caseData = cases.find((c) => c.id === id);
    if (!caseData) return;

    if (!canRefresh(caseData.lastRefreshed)) {
      info("Rate limited", "Please wait 30 minutes between manual refreshes.");
      return;
    }

    setRefreshingId(id);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptNumber: caseData.receiptNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Refresh failed", data.error);
        return;
      }

      const statusChanged = data.status.title !== caseData.currentStatus.title;
      await updateCaseStatus(id, data.status, caseData.history, statusChanged);

      setCases((prev) =>
        prev.map((c) =>
          c.id === id
            ? {
                ...c,
                currentStatus: data.status,
                lastRefreshed: data.status.checkedAt,
                lastChecked: data.status.checkedAt,
                history: statusChanged
                  ? [
                      ...c.history,
                      {
                        id: crypto.randomUUID(),
                        title: data.status.title,
                        description: data.status.description,
                        color: data.status.color,
                        recordedAt: data.status.checkedAt,
                      },
                    ]
                  : c.history,
              }
            : c
        )
      );

      if (statusChanged) {
        success("Status updated!", data.status.title);
      } else {
        info("No change", "Status is unchanged.");
      }
    } catch {
      toastError("Refresh failed");
    } finally {
      setRefreshingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] gradient-mesh">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2.5">
              <LayoutDashboard className="h-6 w-6 text-indigo-400" aria-hidden />
              Dashboard
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {loading
                ? "Loading…"
                : cases.length === 0
                ? "No cases tracked yet"
                : `Tracking ${cases.length} case${cases.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-indigo-500/25 hover:opacity-90 transition-all"
            aria-label="Add new case"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Add Case</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
          ) : (
            <>
              <StatsCard label="Total Cases"    value={stats.total}         icon={FileStack}    color="indigo"  index={0} />
              <StatsCard label="Approved"       value={stats.approved}      icon={CheckCircle2} color="green"   index={1} />
              <StatsCard label="Pending"        value={stats.pending}       icon={Clock}        color="yellow"  index={2} />
              <StatsCard label="Need Attention" value={stats.needAttention} icon={AlertTriangle} color="red"   index={3} />
            </>
          )}
        </div>

        {/* Search + Filter */}
        {(cases.length > 0 || loading) && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
              <input
                type="search"
                placeholder="Search by receipt number, nickname, or status…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] py-2.5 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                aria-label="Search cases"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by status">
              {FILTER_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterStatus(value)}
                  className={cn(
                    "shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-all whitespace-nowrap",
                    filterStatus === value
                      ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                      : "border border-[var(--card-border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]"
                  )}
                  aria-pressed={filterStatus === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Cases Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <CaseCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            hasSearch={!!search || filterStatus !== "all"}
            onAdd={() => setShowAddModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((c, i) => (
                <CaseCard
                  key={c.id}
                  caseData={c}
                  onDelete={handleDelete}
                  onRefresh={handleRefresh}
                  refreshing={refreshingId === c.id}
                  index={i}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AddCaseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddCase}
      />
    </div>
  );
}

function EmptyState({ hasSearch, onAdd }: { hasSearch: boolean; onAdd: () => void }) {
  if (hasSearch) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <Search className="h-10 w-10 mx-auto text-[var(--muted-foreground)] mb-3 opacity-50" aria-hidden />
        <p className="text-[var(--foreground)] font-medium">No cases match your search</p>
        <p className="text-sm text-[var(--muted-foreground)] mt-1">Try adjusting your filters</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-20"
    >
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 mb-6">
        <FolderOpen className="h-10 w-10 text-indigo-400" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">No cases tracked yet</h2>
      <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-6">
        Add your USCIS receipt number to start tracking your case status in real-time.
      </p>
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-xl hover:shadow-indigo-500/30 hover:opacity-90 transition-all"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Track Your First Case
      </button>
    </motion.div>
  );
}
