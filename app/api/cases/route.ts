import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import { fetchCaseStatus, detectFormType } from "@/lib/uscis";

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

// GET: list all cases for user
export async function GET(req: NextRequest) {
  const uid = await verifyUser(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminDb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const snap = await adminDb
    .collection("cases")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  const cases = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ cases });
}

// POST: add a new case
export async function POST(req: NextRequest) {
  const uid = await verifyUser(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminDb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const { receiptNumber, nickname } = await req.json();

  // Check duplicate
  const existing = await adminDb
    .collection("cases")
    .where("userId", "==", uid)
    .where("receiptNumber", "==", receiptNumber)
    .get();

  if (!existing.empty) {
    return NextResponse.json(
      { error: "You are already tracking this case" },
      { status: 409 }
    );
  }

  const status = await fetchCaseStatus(receiptNumber);
  const now = new Date().toISOString();

  const caseData = {
    userId: uid,
    receiptNumber,
    nickname: nickname || null,
    formType: detectFormType(receiptNumber),
    currentStatus: status,
    history: [
      {
        id: crypto.randomUUID(),
        title: status.title,
        description: status.description,
        color: status.color,
        recordedAt: now,
      },
    ],
    lastChecked: now,
    lastRefreshed: now,
    notifyAllUpdates: false,
    createdAt: now,
  };

  const ref = await adminDb.collection("cases").add(caseData);
  return NextResponse.json({ id: ref.id, ...caseData }, { status: 201 });
}
