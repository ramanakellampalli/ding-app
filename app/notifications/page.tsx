"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, CheckCheck, Clock, ArrowRight, Settings2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { NotificationToggle } from "@/components/NotificationToggle";
import { StatusBadge } from "@/components/StatusBadge";
import { NotificationRecord, StatusColor } from "@/types";
import { timeAgo, cn } from "@/lib/utils";

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <Notifications />
    </ProtectedRoute>
  );
}

function Notifications() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/notifications", {
        headers: { authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
    } catch {
      toastError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user, toastError]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = async () => {
    if (!user) return;
    setMarkingRead(true);
    try {
      const token = await user.getIdToken();
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      success("All notifications marked as read");
    } catch {
      toastError("Failed to mark as read");
    } finally {
      setMarkingRead(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[var(--background)] gradient-mesh">
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)] flex items-center gap-2.5">
              <Bell className="h-6 w-6 text-indigo-400" aria-hidden />
              Notifications
              {unreadCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </h1>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingRead}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
              >
                <CheckCheck className="h-4 w-4" aria-hidden />
                Mark all read
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all",
                showSettings
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              aria-expanded={showSettings}
            >
              <Settings2 className="h-4 w-4" aria-hidden />
              Settings
            </button>
          </div>
        </div>

        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-5">
                <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">
                  Notification Preferences
                </h2>
                <NotificationToggle />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notifications list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
                <div className="flex gap-3">
                  <div className="skeleton h-10 w-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-3 w-40" />
                    <div className="skeleton h-4 w-56" />
                    <div className="skeleton h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 mb-6">
              <BellOff className="h-10 w-10 text-indigo-400" aria-hidden />
            </div>
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">
              No notifications yet
            </h2>
            <p className="text-sm text-[var(--muted-foreground)] max-w-sm mx-auto mb-6">
              You&apos;ll receive notifications here when your case status changes.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Go to Dashboard
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {notifications.map((n, i) => (
                <NotificationItem key={n.id} notification={n} index={i} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

function NotificationItem({ notification: n, index }: { notification: NotificationRecord; index: number }) {
  const newStatusColor = getStatusColor(n.newStatus);

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        n.read
          ? "border-[var(--card-border)] bg-[var(--card-bg)]"
          : "border-indigo-500/25 bg-indigo-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            n.read ? "bg-[var(--muted)]" : "bg-indigo-500/15"
          )}
        >
          <Bell
            className={cn("h-4 w-4", n.read ? "text-[var(--muted-foreground)]" : "text-indigo-400")}
            aria-hidden
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-mono text-xs font-semibold text-[var(--foreground)]">
              {n.nickname || n.receiptNumber}
            </span>
            {!n.read && (
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 shrink-0" aria-label="Unread" />
            )}
          </div>
          <p className="text-sm text-[var(--foreground)] leading-snug">
            Status changed to{" "}
            <StatusBadge status={newStatusColor} label={n.newStatus} size="sm" />
          </p>
          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
            Was: {n.oldStatus}
          </p>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--muted-foreground)]">
            <Clock className="h-3 w-3" aria-hidden />
            {timeAgo(n.createdAt)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getStatusColor(statusTitle: string): StatusColor {
  const t = statusTitle.toLowerCase();
  if (t.includes("approved") || t.includes("card was")) return "approved";
  if (t.includes("denied") || t.includes("revoked")) return "denied";
  if (t.includes("rfe") || t.includes("request for evidence")) return "rfe";
  if (t.includes("received") || t.includes("pending") || t.includes("processing")) return "pending";
  return "unknown";
}
