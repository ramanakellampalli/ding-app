import { adminMessaging, adminDb } from "./firebase-admin";

export async function sendPushNotification(
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  if (!adminMessaging || !fcmToken) return;
  try {
    await adminMessaging.send({
      token: fcmToken,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          icon: "/icon-192.png",
          badge: "/badge-72.png",
          vibrate: [200, 100, 200],
        },
      },
    });
  } catch (err) {
    console.error("FCM send error:", err);
  }
}

export async function recordNotification(
  userId: string,
  caseId: string,
  receiptNumber: string,
  nickname: string | undefined,
  oldStatus: string,
  newStatus: string
) {
  if (!adminDb) return;
  await adminDb.collection("notifications").add({
    userId,
    caseId,
    receiptNumber,
    nickname: nickname || null,
    oldStatus,
    newStatus,
    message: `${receiptNumber} changed from "${oldStatus}" to "${newStatus}"`,
    read: false,
    createdAt: new Date().toISOString(),
  });
}
