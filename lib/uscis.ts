import * as cheerio from "cheerio";
import { StatusColor, CaseStatus } from "@/types";

export const RECEIPT_PREFIXES = [
  "EAC", "WAC", "LIN", "SRC", "IOE", "MSC", "NBC", "YSC", "ZAR", "ZCH",
];

export const RECEIPT_PATTERN = /^[A-Z]{3}\d{10}$/;

export function validateReceiptNumber(receiptNumber: string): boolean {
  return RECEIPT_PATTERN.test(receiptNumber.toUpperCase().replace(/[-\s]/g, ""));
}

export function normalizeReceiptNumber(receiptNumber: string): string {
  return receiptNumber.toUpperCase().replace(/[-\s]/g, "");
}

export function detectFormType(receiptNumber: string): string {
  const prefix = receiptNumber.substring(0, 3).toUpperCase();
  const centerMap: Record<string, string> = {
    EAC: "Eastern Adjudication Center",
    WAC: "Western Adjudication Center",
    LIN: "Nebraska Service Center",
    SRC: "Texas Service Center",
    IOE: "USCIS Electronic Immigration System",
    MSC: "National Benefits Center",
    NBC: "National Benefits Center",
    YSC: "Potomac Service Center",
    ZAR: "Arlington Asylum Office",
    ZCH: "Chicago Asylum Office",
  };
  return centerMap[prefix] || "USCIS";
}

export function classifyStatus(title: string): StatusColor {
  const t = title.toLowerCase();
  if (
    t.includes("approved") ||
    t.includes("card was mailed") ||
    t.includes("card was produced") ||
    t.includes("permanently resident")
  ) return "approved";
  if (
    t.includes("request for evidence") ||
    t.includes("rfe") ||
    t.includes("additional evidence") ||
    t.includes("notice of intent to deny")
  ) return "rfe";
  if (
    t.includes("denied") ||
    t.includes("revoked") ||
    t.includes("terminated") ||
    t.includes("rejected")
  ) return "denied";
  if (
    t.includes("received") ||
    t.includes("pending") ||
    t.includes("processing") ||
    t.includes("scheduled") ||
    t.includes("transferred") ||
    t.includes("sent") ||
    t.includes("mailed") ||
    t.includes("dispatched") ||
    t.includes("updated") ||
    t.includes("interview")
  ) return "pending";
  return "unknown";
}

const USCIS_BASE = "https://egov.uscis.gov";
const USCIS_ENDPOINT = `${USCIS_BASE}/casestatus/landing.do`;

// Browser-like headers USCIS expects
const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
};

const CACHE = new Map<string, { data: CaseStatus; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Step 1 — GET the landing page to obtain a session cookie.
 * Step 2 — POST with that cookie + the receipt number.
 * This mimics the real browser flow USCIS expects.
 */
async function fetchWithSession(receiptNumber: string): Promise<string> {
  // Step 1: GET to establish session
  const getRes = await fetch(USCIS_ENDPOINT, {
    method: "GET",
    headers: BROWSER_HEADERS,
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  // Collect Set-Cookie headers
  const setCookie = getRes.headers.get("set-cookie") ?? "";
  const cookies = parseCookies(setCookie);

  // Step 2: POST with the session cookie
  const body = new URLSearchParams({
    appReceiptNum: receiptNumber,
    caseStatusSearchBtn: "CHECK STATUS",
  });

  const postRes = await fetch(USCIS_ENDPOINT, {
    method: "POST",
    headers: {
      ...BROWSER_HEADERS,
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: USCIS_BASE,
      Referer: USCIS_ENDPOINT,
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: body.toString(),
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!postRes.ok) {
    throw new Error(`USCIS returned HTTP ${postRes.status}`);
  }

  return postRes.text();
}

/** Extract name=value pairs from a Set-Cookie header string */
function parseCookies(setCookieHeader: string): string {
  return setCookieHeader
    .split(",")
    .map((c) => c.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");
}

export async function fetchCaseStatus(receiptNumber: string): Promise<CaseStatus> {
  const key = receiptNumber.toUpperCase();

  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const html = await fetchWithSession(key);
      const parsed = parseUSCISResponse(html);

      const result: CaseStatus = {
        ...parsed,
        rawHtml: html,
        checkedAt: new Date().toISOString(),
      };

      CACHE.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }

  throw lastError ?? new Error("Failed to fetch USCIS status");
}

export function parseUSCISResponse(
  html: string
): Omit<CaseStatus, "rawHtml" | "checkedAt"> {
  const $ = cheerio.load(html);

  let title = "";
  let description = "";

  // Primary selectors matching USCIS page structure
  title =
    $(".current-status-sec h2, .case-status h2, #current_status h2, .rows h2")
      .first().text().trim() ||
    $(".appointment-sec h2, .entry-title, .case-status-result h1")
      .first().text().trim() ||
    $("h2").filter((_, el) => {
      const t = $(el).text().trim();
      return !!t && !t.toLowerCase().includes("uscis.gov") && t.length < 200;
    }).first().text().trim() ||
    $("h1").first().text().trim() ||
    "Status Unknown";

  description =
    $(".appointment-sec p, .case-status p, #current_status p, .rows.text-center p")
      .first().text().trim() ||
    $("p").filter((_, el) => $(el).text().trim().length > 50)
      .first().text().trim() ||
    "No description available.";

  return {
    title: title || "Status Unknown",
    description: description || "",
    color: classifyStatus(title),
  };
}
