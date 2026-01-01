import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: "Server auth is not configured" }, { status: 500 });
    }

    const secretHeader = request.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || secretHeader !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await adminDb.collection("staff").get();
    const recipients: string[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.email && typeof data.email === "string") {
        recipients.push(data.email);
      }
    });

    const uniqueRecipients = Array.from(new Set(recipients));

    await Promise.all(
      uniqueRecipients.map((email) =>
        sendEmail({
          to: email,
          subject: "Monthly password reminder",
          text: "This is your monthly reminder to review and, if needed, update your account password.",
          html: "<p>This is your monthly reminder to review and, if needed, update your account password.</p>",
        })
      )
    );

    return NextResponse.json({ ok: true, sent: uniqueRecipients.length });
  } catch (error) {
    console.error("monthly-password-reminder error", error);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
