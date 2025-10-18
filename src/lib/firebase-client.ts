// Firebase configuration using environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};




import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // THIS IS REQUIRED FOR 'auth'
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore"; // THIS IS REQUIRED FOR 'db'
import { getStorage } from "firebase/storage"; // THIS IS REQUIRED FOR 'storage'
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// THESE EXPORTS ARE CRITICAL for other files to import 'auth', 'db', and 'storage'
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

let analytics: ReturnType<typeof getAnalytics> | undefined;

export const initializeClientSideServices = async () => {
    if (typeof window !== 'undefined') {
        // Enable offline persistence
        try {
            await enableMultiTabIndexedDbPersistence(db);
        } catch (err: unknown) {
            const e = err as { code?: string };
            if (e.code === 'failed-precondition') {
                console.warn('Firestore offline persistence failed: Multiple tabs open.');
            } else if (e.code === 'unimplemented') {
                console.warn('Firestore offline persistence not available in this browser.');
            }
        }

        // Enable Analytics (commented out to avoid errors)
        // try {
        //     const supported = await isAnalyticsSupported();
        //     if (supported && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
        //         analytics = getAnalytics(app);
        //     }
        // } catch (error) {
        //     console.error("Failed to initialize Analytics", error);
        // }
    }
}

