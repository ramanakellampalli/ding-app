import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { fetchCaseStatus } from "@/lib/uscis";
import {
  sendPushNotification,
  sendEmailNotification,
  recordNotification,
} from "@/lib/notifications";

// Firebase App Hosting runs on Cloud Run — no maxDuration limit needed.
// Schedule this endpoint via Google Cloud Scheduler:
//   URL: https://<your-app>.web.app/api/cron/poll
//   Method: GET
//   Frequency: every 4 hours  →  0 */4 * * *
//   Add header: Authorization: Bearer <CRON_SECRET>
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Admin SDK not configured" }, { status: 503 });
  }

  try {
    const casesSnap = await adminDb.collection("cases").get();
    const results = { checked: 0, updated: 0, errors: 0 };

    for (const caseDoc of casesSnap.docs) {
      const caseData = caseDoc.data();
      const { userId, receiptNumber, currentStatus, nickname } = caseData;

      try {
        const newStatus = await fetchCaseStatus(receiptNumber);
        results.checked++;

        const statusChanged = newStatus.title !== currentStatus?.title;

        if (statusChanged) {
          // Log history entry
          const historyEntry = {
            id: crypto.randomUUID(),
            title: newStatus.title,
            description: newStatus.description,
            color: newStatus.color,
            recordedAt: new Date().toISOString(),
          };

          await caseDoc.ref.update({
            currentStatus: newStatus,
            lastChecked: new Date().toISOString(),
            history: [...(caseData.history || []), historyEntry],
          });

          results.updated++;

          // Determine if this is a major change
          const isMajor = ["approved", "denied", "rfe"].includes(newStatus.color);
          const shouldNotify = caseData.notifyAllUpdates || isMajor;

          if (shouldNotify) {
            // Get user profile for FCM + email
            const userDoc = await adminDb.collection("users").doc(userId).get();
            const user = userDoc.data();

            if (user) {
              if (user.notifyPush && user.fcmToken) {
                await sendPushNotification(
                  user.fcmToken,
                  `Case Update: ${nickname || receiptNumber}`,
                  newStatus.title,
                  { caseId: caseDoc.id, receiptNumber }
                );
              }

              if (user.notifyEmail && user.email) {
                await sendEmailNotification(
                  user.email,
                  receiptNumber,
                  nickname,
                  currentStatus?.title || "Unknown",
                  newStatus.title,
                  newStatus.description
                );
              }

              await recordNotification(
                userId,
                caseDoc.id,
                receiptNumber,
                nickname,
                currentStatus?.title || "Unknown",
                newStatus.title
              );
            }
          }
        } else {
          // Just update lastChecked
          await caseDoc.ref.update({ lastChecked: new Date().toISOString() });
        }
      } catch (err) {
        results.errors++;
        console.error(`Failed to check case ${receiptNumber}:`, err);
      }

      // Small delay between requests to be respectful to USCIS
      await new Promise((r) => setTimeout(r, 500));
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Cron poll error:", err);
    return NextResponse.json(
      { error: "Cron job failed", detail: String(err) },
      { status: 500 }
    );
  }
}
