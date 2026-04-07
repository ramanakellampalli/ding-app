import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { fetchCaseStatus } from "@/lib/uscis";
import { canRefresh } from "@/lib/utils";

async function verifyUser(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token || !adminAuth) return null;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch {
    return null;
  }
}

// DELETE case
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyUser(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminDb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const doc = await adminDb.collection("cases").doc(params.id).get();
  if (!doc.exists || doc.data()?.userId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await doc.ref.delete();
  return NextResponse.json({ success: true });
}

// POST: manual refresh
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const uid = await verifyUser(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminDb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const doc = await adminDb.collection("cases").doc(params.id).get();
  if (!doc.exists || doc.data()?.userId !== uid) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const caseData = doc.data()!;

  // Rate limit: 1 refresh per 30 min
  if (!canRefresh(caseData.lastRefreshed)) {
    return NextResponse.json(
      { error: "Rate limited. Please wait 30 minutes between manual refreshes." },
      { status: 429 }
    );
  }

  const newStatus = await fetchCaseStatus(caseData.receiptNumber);
  const now = new Date().toISOString();
  const statusChanged = newStatus.title !== caseData.currentStatus?.title;

  const updates: Record<string, unknown> = {
    currentStatus: newStatus,
    lastChecked: now,
    lastRefreshed: now,
  };

  if (statusChanged) {
    const entry = {
      id: crypto.randomUUID(),
      title: newStatus.title,
      description: newStatus.description,
      color: newStatus.color,
      recordedAt: now,
    };
    updates.history = [...(caseData.history || []), entry];
  }

  await doc.ref.update(updates);

  return NextResponse.json({
    status: newStatus,
    statusChanged,
    lastRefreshed: now,
  });
}
