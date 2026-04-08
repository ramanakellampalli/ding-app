/**
 * Client-side Firestore helpers for case management.
 * Uses the Firebase client SDK directly — no Admin SDK required.
 */
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { USCISCase, CaseHistoryEntry } from "@/types";
import { detectFormType } from "@/lib/uscis";

const CASES = "cases";

export async function getUserCases(userId: string): Promise<USCISCase[]> {
  const q = query(
    collection(db, CASES),
    where("userId", "==", userId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as USCISCase));
}

export async function getCaseById(caseId: string): Promise<USCISCase | null> {
  const snap = await getDoc(doc(db, CASES, caseId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as USCISCase;
}

export async function addCase(
  userId: string,
  receiptNumber: string,
  nickname: string | undefined,
  status: { title: string; description: string; color: string; checkedAt: string }
): Promise<USCISCase> {
  const now = new Date().toISOString();
  const firstEntry: CaseHistoryEntry = {
    id: crypto.randomUUID(),
    title: status.title,
    description: status.description,
    color: status.color as USCISCase["currentStatus"]["color"],
    recordedAt: now,
  };

  const data = {
    userId,
    receiptNumber,
    nickname: nickname || null,
    formType: detectFormType(receiptNumber),
    currentStatus: status,
    history: [firstEntry],
    lastChecked: now,
    lastRefreshed: now,
    notifyAllUpdates: false,
    createdAt: now,
  };

  const ref = await addDoc(collection(db, CASES), data);
  return { id: ref.id, ...data } as USCISCase;
}

export async function deleteCaseById(caseId: string): Promise<void> {
  await deleteDoc(doc(db, CASES, caseId));
}

export async function updateCaseStatus(
  caseId: string,
  newStatus: USCISCase["currentStatus"],
  existingHistory: CaseHistoryEntry[],
  statusChanged: boolean
): Promise<void> {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    currentStatus: newStatus,
    lastChecked: now,
    lastRefreshed: now,
  };

  if (statusChanged) {
    updates.history = [
      ...existingHistory,
      {
        id: crypto.randomUUID(),
        title: newStatus.title,
        description: newStatus.description,
        color: newStatus.color,
        recordedAt: now,
      },
    ];
  }

  await updateDoc(doc(db, CASES, caseId), updates);
}

export async function checkDuplicate(
  userId: string,
  receiptNumber: string
): Promise<boolean> {
  const q = query(
    collection(db, CASES),
    where("userId", "==", userId),
    where("receiptNumber", "==", receiptNumber)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}
