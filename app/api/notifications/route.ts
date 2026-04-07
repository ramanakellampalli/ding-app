import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase-admin";

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

// GET notifications
export async function GET(req: NextRequest) {
  const uid = await verifyUser(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminDb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const snap = await adminDb
    .collection("notifications")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ notifications });
}

// PATCH: mark all as read
export async function PATCH(req: NextRequest) {
  const uid = await verifyUser(req);
  if (!uid) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!adminDb) return NextResponse.json({ error: "DB unavailable" }, { status: 503 });

  const snap = await adminDb
    .collection("notifications")
    .where("userId", "==", uid)
    .where("read", "==", false)
    .get();

  const batch = adminDb.batch();
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();

  return NextResponse.json({ updated: snap.size });
}
