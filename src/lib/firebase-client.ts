
"use client";

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";
import { firebaseConfig } from "./firebase";

let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

let analytics: any;

const initializeClientSideServices = async () => {
    if (typeof window !== 'undefined') {
        // Enable offline persistence
        try {
            await enableIndexedDbPersistence(db);
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                console.warn('Firestore offline persistence failed: Multiple tabs open.');
            } else if (err.code === 'unimplemented') {
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

// Call the async function to initialize client-side services
initializeClientSideServices();


export { app, auth, db, storage, analytics };
