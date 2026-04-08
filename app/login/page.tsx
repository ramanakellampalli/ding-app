"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth, friendlyAuthError } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/utils";

type View = "login" | "signup" | "forgot";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword } = useAuth();
  const { success } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const switchView = (v: View) => {
    setView(v);
    setError("");
    setResetSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (view === "login") {
        await signInWithEmail(email, password);
        success("Welcome back!");
      } else if (view === "signup") {
        await signUpWithEmail(email, password, name.trim());
        success("Account created! Welcome to Ding.");
      } else {
        await resetPassword(email);
        setResetSent(true);
      }
    } catch (err) {
      const msg = friendlyAuthError(err);
      if (msg) setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      success("Signed in with Google!");
    } catch (err) {
      const msg = friendlyAuthError(err);
      if (msg) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] gradient-mesh p-4">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-500/6 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-500/6 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-4"
          >
            <Zap className="h-8 w-8 text-white" aria-hidden />
          </motion.div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Ding</h1>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">USCIS Case Tracker</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-2xl overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {/* ── FORGOT PASSWORD ── */}
            {view === "forgot" && (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.22 }}
                className="p-6"
              >
                <button
                  onClick={() => switchView("login")}
                  className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Back to sign in
                </button>

                <h2 className="text-base font-semibold text-[var(--foreground)] mb-1">
                  Reset your password
                </h2>
                <p className="text-xs text-[var(--muted-foreground)] mb-5">
                  Enter your email and we&apos;ll send a reset link.
                </p>

                {resetSent ? (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
                      <CheckCircle2 className="h-6 w-6 text-green-400" aria-hidden />
                    </div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Email sent!</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      Check <span className="font-medium text-[var(--foreground)]">{email}</span> for a reset link.
                    </p>
                    <button
                      onClick={() => switchView("login")}
                      className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      Back to sign in →
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
                      <input
                        type="email"
                        placeholder="Email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        autoFocus
                        className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--muted)] py-2.5 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                      />
                    </div>
                    <ErrorBanner message={error} />
                    <SubmitButton loading={loading} label="Send reset link" />
                  </form>
                )}
              </motion.div>
            )}

            {/* ── LOGIN / SIGNUP ── */}
            {(view === "login" || view === "signup") && (
              <motion.div
                key="auth"
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.22 }}
                className="p-6"
              >
                {/* Tabs */}
                <div className="flex rounded-xl bg-[var(--muted)] p-1 mb-6" role="tablist">
                  {(["login", "signup"] as const).map((tab) => (
                    <button
                      key={tab}
                      role="tab"
                      aria-selected={view === tab}
                      onClick={() => switchView(tab)}
                      className={cn(
                        "flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200",
                        view === tab
                          ? "bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm"
                          : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      )}
                    >
                      {tab === "login" ? "Sign In" : "Sign Up"}
                    </button>
                  ))}
                </div>

                {/* Email / password form */}
                <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                  <AnimatePresence initial={false}>
                    {view === "signup" && (
                      <motion.div
                        key="name-field"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.18 }}
                        className="overflow-hidden"
                      >
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
                          <input
                            type="text"
                            placeholder="Full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            autoComplete="name"
                            className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--muted)] py-2.5 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--muted)] py-2.5 pl-9 pr-4 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" aria-hidden />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete={view === "login" ? "current-password" : "new-password"}
                      minLength={6}
                      className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--muted)] py-2.5 pl-9 pr-10 text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Forgot password — only on login */}
                  {view === "login" && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchView("forgot")}
                        className="text-xs text-[var(--muted-foreground)] hover:text-indigo-400 transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  <ErrorBanner message={error} />

                  <SubmitButton
                    loading={loading}
                    label={view === "login" ? "Sign In" : "Create Account"}
                  />
                </form>

                {/* Google — secondary */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--card-border)]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[var(--card-bg)] px-3 text-[var(--muted-foreground)]">
                      or
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                  className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--muted)] py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--card-border)] transition-all disabled:opacity-60"
                >
                  {googleLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <GoogleLogo />
                  )}
                  Continue with Google
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-[var(--muted-foreground)] mt-4">
          Track your USCIS cases with real-time notifications
        </p>
      </motion.div>
    </div>
  );
}

/* ── Shared sub-components ── */

function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2.5"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" aria-hidden />
      <p className="text-xs text-red-400 leading-snug">{message}</p>
    </motion.div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-indigo-500/30 hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      ) : (
        label
      )}
    </button>
  );
}

function GoogleLogo() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
