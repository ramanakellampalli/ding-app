"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, RefreshCw, ExternalLink, Calendar, Globe, TrendingUp } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { cn } from "@/lib/utils";

interface BulletinData {
  month: string;
  year: string;
  url: string;
  employmentFinal: Record<string, Record<string, string>>;
  familyFinal: Record<string, Record<string, string>>;
  fetchedAt: string;
}

const COUNTRIES = ["China", "India", "Mexico", "Philippines"];

export default function VisaBulletinPage() {
  return (
    <ProtectedRoute>
      <VisaBulletin />
    </ProtectedRoute>
  );
}

function VisaBulletin() {
  const [bulletin, setBulletin] = useState<BulletinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"employment" | "family">("employment");

  const fetchBulletin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/visa-bulletin");
      const data = await res.json();
      setBulletin(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulletin();
  }, []);

  const tableData =
    activeTab === "employment" ? bulletin?.employmentFinal : bulletin?.familyFinal;

  return (
    <div className="min-h-screen bg-[var(--background)] gradient-mesh">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-indigo-400" aria-hidden />
              Visa Bulletin
            </h1>
            {bulletin && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" aria-hidden />
                {bulletin.month} {bulletin.year}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchBulletin}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              aria-label="Refresh visa bulletin"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} aria-hidden />
              Refresh
            </button>
            {bulletin?.url && (
              <a
                href={bulletin.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                Official Source
              </a>
            )}
          </div>
        </div>

        {/* Info banner */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-4 mb-6"
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" aria-hidden />
            <p className="text-sm text-[var(--muted-foreground)]">
              Priority dates listed below show the cutoff for visa availability.
              <strong className="text-[var(--foreground)]"> &quot;Current&quot;</strong> means visas are immediately available for that category.
              Dates are updated monthly by the U.S. Department of State.
            </p>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex rounded-xl bg-[var(--muted)] p-1 mb-6 w-fit">
          {([
            { value: "employment" as const, label: "Employment-Based" },
            { value: "family" as const, label: "Family-Based" },
          ]).map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
                activeTab === tab.value
                  ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              )}
              aria-pressed={activeTab === tab.value}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <BulletinSkeleton />
        ) : !bulletin || !tableData || Object.keys(tableData).length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]">
            <Globe className="h-10 w-10 mx-auto text-[var(--muted-foreground)] mb-3 opacity-50" aria-hidden />
            <p className="text-[var(--foreground)] font-medium">No data available</p>
            <p className="text-sm text-[var(--muted-foreground)] mt-1">
              Check the official source for the latest bulletin.
            </p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm" aria-label={`${activeTab === "employment" ? "Employment" : "Family"}-based visa bulletin`}>
                <thead>
                  <tr className="border-b border-[var(--card-border)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider w-24">
                      Category
                    </th>
                    {COUNTRIES.map((c) => (
                      <th
                        key={c}
                        className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider"
                      >
                        {c}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                      All Others
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(tableData).map(([category, dates], i) => (
                    <tr
                      key={category}
                      className={cn(
                        "border-b border-[var(--card-border)] last:border-0 transition-colors hover:bg-[var(--muted)]",
                        i % 2 === 0 ? "" : "bg-[var(--muted)]/30"
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-indigo-400">
                        {category}
                      </td>
                      {COUNTRIES.map((country) => {
                        const rawDate = dates[country] || "—";
                        const isCurrent = rawDate === "Current";
                        const isUnavailable = rawDate === "U" || rawDate === "Unavailable";
                        return (
                          <td key={country} className="px-4 py-3">
                            <span
                              className={cn(
                                "text-xs font-medium",
                                isCurrent ? "text-green-400 font-semibold" :
                                isUnavailable ? "text-red-400" :
                                "text-[var(--foreground)]"
                              )}
                            >
                              {rawDate}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {Object.entries(dates).find(([k]) => !COUNTRIES.includes(k))?.[1] || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-green-400" aria-hidden />
            <span>Current — visas immediately available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400" aria-hidden />
            <span>U — unavailable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-indigo-400" aria-hidden />
            <span>Date — priority date cutoff (DDMMMYY)</span>
          </div>
        </div>
      </main>
    </div>
  );
}

function BulletinSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden">
      <div className="p-4 border-b border-[var(--card-border)]">
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-4 w-20" />
          ))}
        </div>
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 border-b border-[var(--card-border)] last:border-0">
          <div className="flex gap-4">
            {[...Array(5)].map((_, j) => (
              <div key={j} className="skeleton h-4 w-20" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
