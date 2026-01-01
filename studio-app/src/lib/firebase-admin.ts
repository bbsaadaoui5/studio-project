import { getApps, initializeApp, applicationDefault, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Helper to load service account credentials from env (JSON or discrete fields)
const loadServiceAccount = () => {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inline) {
    try {
      const parsed = JSON.parse(inline);
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
      }
      return parsed;
    } catch (error) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON", error);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
};

const serviceAccount = loadServiceAccount();
const shouldInit = typeof window === "undefined";
const app = shouldInit
  ? getApps()[0] ||
    initializeApp(
      serviceAccount
        ? { credential: cert(serviceAccount as any) }
        : { credential: applicationDefault() }
    )
  : null;

export const adminAuth = app ? getAuth(app) : null;
export const adminDb = app ? getFirestore(app) : null;
export const isFirebaseAdminConfigured = !!app;
