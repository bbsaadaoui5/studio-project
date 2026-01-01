import crypto from "crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "./firebase-admin";

const OTP_COLLECTION = "loginOtps";
const OTP_TTL_MINUTES = Number(process.env.OTP_TTL_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS || 5);
const OTP_SECRET = process.env.OTP_SECRET || "otp-secret";

const hashOtp = (email: string, code: string) => {
  return crypto
    .createHash("sha256")
    .update(`${email.toLowerCase()}:${code}:${OTP_SECRET}`)
    .digest("hex");
};

const generateOtpCode = () => {
  const code = crypto.randomInt(0, 1_000_000);
  return code.toString().padStart(6, "0");
};

export const createOtpForUser = async (email: string, uid: string) => {
  if (!adminDb) throw new Error("Firebase admin is not configured");
  const code = generateOtpCode();
  const codeHash = hashOtp(email, code);
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromDate(new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000));

  const ref = adminDb.collection(OTP_COLLECTION).doc(email.toLowerCase());
  await ref.set({
    email: email.toLowerCase(),
    uid,
    codeHash,
    attempts: 0,
    consumed: false,
    createdAt: now,
    expiresAt,
    lastSentAt: now,
  });

  return { code, expiresAt };
};

export const verifyOtpForUser = async (email: string, code: string) => {
  if (!adminDb) throw new Error("Firebase admin is not configured");
  const ref = adminDb.collection(OTP_COLLECTION).doc(email.toLowerCase());
  const snap = await ref.get();
  if (!snap.exists) {
    throw new Error("OTP not found. Please request a new code.");
  }

  const data = snap.data() as any;
  if (data.consumed) {
    throw new Error("This code has already been used.");
  }
  if (data.attempts >= OTP_MAX_ATTEMPTS) {
    throw new Error("Too many attempts. Please request a new code.");
  }
  if (data.expiresAt && data.expiresAt.toDate() < new Date()) {
    throw new Error("This code has expired. Please request a new one.");
  }

  const expectedHash = hashOtp(email, code);
  if (expectedHash !== data.codeHash) {
    await ref.update({ attempts: FieldValue.increment(1) });
    throw new Error("Invalid code. Please try again.");
  }

  await ref.update({ consumed: true, consumedAt: Timestamp.now() });
  return { uid: data.uid as string };
};
