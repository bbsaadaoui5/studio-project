import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { verifyOtpForUser } from "@/lib/otp";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }
    if (!adminAuth) {
      return NextResponse.json({ error: "Server auth is not configured" }, { status: 500 });
    }

    const { uid } = await verifyOtpForUser(email, code);
    const token = await adminAuth.createCustomToken(uid, { otp: true });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("verify-otp error", error);
    const message = error instanceof Error ? error.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
