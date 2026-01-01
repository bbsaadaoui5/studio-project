import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { sendEmail } from "@/lib/email";
import { createOtpForUser } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Server auth is not configured" }, { status: 500 });
    }

    const user = await adminAuth.getUserByEmail(email).catch(() => null);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { code, expiresAt } = await createOtpForUser(email, user.uid);

    await sendEmail({
      to: email,
      subject: "Your login code",
      text: `Your one-time code is ${code}. It expires in 10 minutes.`,
      html: `<p>Your one-time code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });

    return NextResponse.json({ ok: true, expiresAt: expiresAt.toDate().toISOString() });
  } catch (error) {
    console.error("send-otp error", error);
    return NextResponse.json({ error: "Failed to send code" }, { status: 500 });
  }
}
