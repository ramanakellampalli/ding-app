import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function timeAgo(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(isoString);
}

export function canRefresh(lastRefreshed?: string): boolean {
  if (!lastRefreshed) return true;
  const diff = Date.now() - new Date(lastRefreshed).getTime();
  return diff > 30 * 60 * 1000; // 30 min cooldown
}

export function nextRefreshIn(lastRefreshed?: string): string {
  if (!lastRefreshed) return "";
  const diff = Date.now() - new Date(lastRefreshed).getTime();
  const remaining = 30 * 60 * 1000 - diff;
  if (remaining <= 0) return "";
  const mins = Math.ceil(remaining / 60000);
  return `${mins}m`;
}
