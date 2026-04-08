"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Smartphone } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

export function NotificationToggle() {
  const { profile, updateUserProfile } = useAuth();
  const { success } = useToast();
  const [saving, setSaving] = useState(false);

  if (!profile) return null;

  const update = async (key: keyof typeof profile, value: boolean) => {
    setSaving(true);
    try {
      await updateUserProfile({ [key]: value });
      success("Preferences saved");
    } finally {
      setSaving(false);
    }
  };

  const toggles = [
    {
      key: "notifyPush" as const,
      label: "Push notifications",
      description: "Browser push alerts for status changes",
      icon: Smartphone,
      value: profile.notifyPush,
    },
    {
      key: "notifyAllUpdates" as const,
      label: "All updates",
      description: "Notify on every change (off = only Approved / Denied / RFE)",
      icon: Bell,
      value: profile.notifyAllUpdates,
    },
  ];

  return (
    <div className="space-y-3">
      {toggles.map(({ key, label, description, icon: Icon, value }) => (
        <div
          key={key}
          className="flex items-center justify-between gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                value
                  ? "bg-indigo-500/15 text-indigo-400"
                  : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              )}
            >
              {value ? <Icon className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
              <p className="text-xs text-[var(--muted-foreground)]">{description}</p>
            </div>
          </div>

          <button
            onClick={() => update(key, !value)}
            disabled={saving}
            role="switch"
            aria-checked={value}
            aria-label={label}
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              value
                ? "border-indigo-500 bg-indigo-500"
                : "border-[var(--card-border)] bg-[var(--muted)]"
            )}
          >
            <motion.span
              layout
              className="inline-block h-4 w-4 rounded-full bg-white shadow-sm"
              animate={{ x: value ? 20 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      ))}
    </div>
  );
}
