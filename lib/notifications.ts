import { adminMessaging, adminDb } from "./firebase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function sendEmailNotification(
  to: string,
  receiptNumber: string,
  nickname: string | undefined,
  oldStatus: string,
  newStatus: string,
  description: string
) {
  if (!process.env.RESEND_API_KEY) return;
  const caseLabel = nickname ? `${nickname} (${receiptNumber})` : receiptNumber;

  try {
    await resend.emails.send({
      from: "Ding Case Tracker <notifications@ding.app>",
      to,
      subject: `Case Update: ${caseLabel} → ${newStatus}`,
      html: buildEmailHtml(caseLabel, oldStatus, newStatus, description),
    });
  } catch (err) {
    console.error("Resend email error:", err);
  }
}

function buildEmailHtml(
  caseLabel: string,
  oldStatus: string,
  newStatus: string,
  description: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Case Status Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #111; border: 1px solid #222; border-radius: 16px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Ding</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">USCIS Case Tracker</p>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #e5e5e5; margin: 0 0 24px; font-size: 20px;">Case Status Update</h2>
      <p style="color: #a3a3a3; margin: 0 0 24px;">Your case <strong style="color: #e5e5e5;">${caseLabel}</strong> has a new status update.</p>
      <div style="background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <span style="color: #6b7280; font-size: 13px;">Previous Status</span>
          <span style="color: #e5e5e5; font-size: 13px; font-weight: 500;">${oldStatus}</span>
        </div>
        <div style="border-top: 1px solid #333; margin: 12px 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #6b7280; font-size: 13px;">New Status</span>
          <span style="color: #a78bfa; font-size: 13px; font-weight: 600;">${newStatus}</span>
        </div>
      </div>
      <div style="background: #0f172a; border-left: 3px solid #6366f1; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="color: #94a3b8; margin: 0; font-size: 14px; line-height: 1.6;">${description}</p>
      </div>
      <a href="https://ding.app/dashboard" style="display: block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 24px; border-radius: 10px; text-align: center; font-weight: 600; font-size: 15px;">View Case Details →</a>
    </div>
    <div style="padding: 20px 32px; border-top: 1px solid #222; text-align: center;">
      <p style="color: #4b5563; margin: 0; font-size: 12px;">You received this because you track this case on Ding. <a href="https://ding.app/notifications" style="color: #6366f1;">Manage notifications</a></p>
    </div>
  </div>
</body>
</html>`;
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
