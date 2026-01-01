// Replace this entire firebaseConfig object with the one you copied from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyCiJTljEbnWD6bwznbm3jFGRlwueNWSFg4",
  authDomain: "campusc-working.firebaseapp.com",
  projectId: "campusc-working",
  storageBucket: "campusc-working.firebasestorage.app",
  messagingSenderId: "935230427973",
  appId: "1:935230427973:web:450765d14e63c00f58a42c"







};

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // <-- THIS IS VITAL
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"; // <-- THIS IS VITAL
import { getStorage } from "firebase/storage"; // <-- THIS IS VITAL
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// THESE ARE THE EXPORTS THAT WERE MISSING
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

let analytics: ReturnType<typeof getAnalytics> | undefined;

export const initializeClientSideServices = async () => {
    if (typeof window !== 'undefined') {
        // Enable offline persistence
        try {
            await enableIndexedDbPersistence(db);
        } catch (err: unknown) {
            const e = err as { code?: string };
            if (e.code === 'failed-precondition') {
                console.warn('Firestore offline persistence failed: Multiple tabs open.');
            } else if (e.code === 'unimplemented') {
                console.warn('Firestore offline persistence not available in this browser.');
            }
        }

        // Enable Analytics
        try {
            const supported = await isAnalyticsSupported();
            if (supported) {
                analytics = getAnalytics(app);
            }
        } catch (error) {
            console.error("Failed to initialize Analytics", error);
        }
    }
}

