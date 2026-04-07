import * as cheerio from "cheerio";
import { StatusColor, CaseStatus } from "@/types";

export const RECEIPT_PREFIXES = [
  "EAC",
  "WAC",
  "LIN",
  "SRC",
  "IOE",
  "MSC",
  "NBC",
  "YSC",
  "ZAR",
  "ZCH",
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
  )
    return "approved";
  if (
    t.includes("request for evidence") ||
    t.includes("rfe") ||
    t.includes("additional evidence") ||
    t.includes("notice of intent to deny")
  )
    return "rfe";
  if (
    t.includes("denied") ||
    t.includes("revoked") ||
    t.includes("terminated") ||
    t.includes("rejected")
  )
    return "denied";
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
  )
    return "pending";
  return "unknown";
}

const USCIS_ENDPOINT = "https://egov.uscis.gov/casestatus/landing.do";
const CACHE = new Map<string, { data: CaseStatus; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchCaseStatus(
  receiptNumber: string
): Promise<CaseStatus> {
  const key = receiptNumber.toUpperCase();

  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const MAX_RETRIES = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const body = new URLSearchParams({
        appReceiptNum: key,
        caseStatusSearchBtn: "CHECK STATUS",
      });

      const res = await fetch(USCIS_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (compatible; DingCaseTracker/1.0; +https://ding.app)",
          Referer: "https://egov.uscis.gov/casestatus/landing.do",
        },
        body: body.toString(),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        throw new Error(`USCIS returned HTTP ${res.status}`);
      }

      const html = await res.text();
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

  throw lastError || new Error("Failed to fetch USCIS status");
}

export function parseUSCISResponse(html: string): Omit<CaseStatus, "rawHtml" | "checkedAt"> {
  const $ = cheerio.load(html);

  let title = "";
  let description = "";

  // Try various selectors USCIS uses
  const h1 = $("h1").first().text().trim();
  const h2 = $("h2").first().text().trim();
  const mainHeader =
    $(".current-status-sec h2, .case-status h2, #current_status h2, .rows h2")
      .first()
      .text()
      .trim();

  title =
    mainHeader ||
    $(".appointment-sec h2, .entry-title, .case-status-result h1")
      .first()
      .text()
      .trim() ||
    h2 ||
    h1 ||
    "Status Unknown";

  description =
    $(".appointment-sec p, .case-status p, #current_status p, .rows.text-center p")
      .first()
      .text()
      .trim() ||
    $("p").filter((_, el) => $(el).text().length > 50).first().text().trim() ||
    "No description available.";

  // Fallback: look for the main content block
  if (!title || title === "Status Unknown") {
    const allH2 = $("h2").toArray();
    for (const el of allH2) {
      const text = $(el).text().trim();
      if (text && !text.toLowerCase().includes("uscis") && text.length < 200) {
        title = text;
        break;
      }
    }
  }

  const color = classifyStatus(title);

  return { title: title || "Status Unknown", description: description || "", color };
}
