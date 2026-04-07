import { NextRequest, NextResponse } from "next/server";
import { fetchCaseStatus, validateReceiptNumber, normalizeReceiptNumber } from "@/lib/uscis";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { receiptNumber } = body;

    if (!receiptNumber || typeof receiptNumber !== "string") {
      return NextResponse.json(
        { error: "receiptNumber is required" },
        { status: 400 }
      );
    }

    const normalized = normalizeReceiptNumber(receiptNumber);

    if (!validateReceiptNumber(normalized)) {
      return NextResponse.json(
        {
          error:
            "Invalid receipt number format. Expected format: 3 letters + 10 digits (e.g. EAC2190123456)",
        },
        { status: 422 }
      );
    }

    const status = await fetchCaseStatus(normalized);

    return NextResponse.json({ receiptNumber: normalized, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message.includes("USCIS") || message.includes("HTTP")) {
      return NextResponse.json(
        {
          error:
            "USCIS system is temporarily unavailable. Please try again in a few minutes.",
          detail: message,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch case status", detail: message },
      { status: 500 }
    );
  }
}
