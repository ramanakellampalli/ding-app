"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Loader2, AlertCircle, Hash } from "lucide-react";
import { validateReceiptNumber, normalizeReceiptNumber, RECEIPT_PREFIXES } from "@/lib/uscis";
import { cn } from "@/lib/utils";

interface AddCaseModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (receiptNumber: string, nickname?: string) => Promise<void>;
}

export function AddCaseModal({ open, onClose, onAdd }: AddCaseModalProps) {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const normalized = normalizeReceiptNumber(receiptNumber);
  const isValid = validateReceiptNumber(normalized);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!isValid) {
      setError("Invalid receipt number format. Expected: AAA##########");
      return;
    }
    setLoading(true);
    try {
      await onAdd(normalized, nickname.trim() || undefined);
      setReceiptNumber("");
      setNickname("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add case");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setReceiptNumber("");
    setNickname("");
    setError("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-case-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--card-border)] px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
                  <Plus className="h-4 w-4" />
                </div>
                <h2
                  id="add-case-title"
                  className="text-base font-semibold text-[var(--foreground)]"
                >
                  Track New Case
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-all"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label
                  htmlFor="receipt-number"
                  className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                >
                  Receipt Number
                  <span className="text-red-400 ml-0.5" aria-hidden>*</span>
                </label>
                <div className="relative">
                  <Hash
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]"
                    aria-hidden
                  />
                  <input
                    ref={inputRef}
                    id="receipt-number"
                    type="text"
                    value={receiptNumber}
                    onChange={(e) =>
                      setReceiptNumber(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
                    }
                    placeholder="EAC2190123456"
                    maxLength={13}
                    required
                    autoFocus
                    autoComplete="off"
                    spellCheck={false}
                    className={cn(
                      "w-full rounded-xl border bg-[var(--muted)] py-2.5 pl-9 pr-4 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-500/50",
                      normalized.length === 13 && !isValid
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : isValid
                        ? "border-green-500/50 focus:ring-green-500/30"
                        : "border-[var(--card-border)]"
                    )}
                    aria-describedby="receipt-hint"
                  />
                  {isValid && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-xs font-medium">
                      Valid
                    </span>
                  )}
                </div>
                <p
                  id="receipt-hint"
                  className="mt-1.5 text-xs text-[var(--muted-foreground)]"
                >
                  Supported prefixes:{" "}
                  <span className="font-mono">{RECEIPT_PREFIXES.join(", ")}</span>
                </p>
              </div>

              <div>
                <label
                  htmlFor="nickname"
                  className="block text-sm font-medium text-[var(--foreground)] mb-1.5"
                >
                  Nickname{" "}
                  <span className="text-xs font-normal text-[var(--muted-foreground)]">
                    (optional)
                  </span>
                </label>
                <input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. My Green Card"
                  maxLength={50}
                  className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--muted)] py-2.5 px-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" aria-hidden />
                  <p className="text-xs text-red-400">{error}</p>
                </motion.div>
              )}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-[var(--card-border)] py-2.5 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !isValid}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                    "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg",
                    "hover:shadow-indigo-500/30 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      Fetching…
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" aria-hidden />
                      Track Case
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
