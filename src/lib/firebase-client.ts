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

// Expose the public projectId for developer diagnostics only.
export const getPublicFirebaseProjectId = () => firebaseConfig.projectId || null;




import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
// firebase/storage does not export a stable 'Storage' type across versions used in this repo.
// Use `any` here to avoid a type import error while preserving runtime behavior.
type StorageType = any;
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore"; // THIS IS REQUIRED FOR 'db'
import { getAuth } from "firebase/auth"; // imported but not called on server
import { getStorage } from "firebase/storage"; // imported but not called on server
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

let app: FirebaseApp | null = null;
const FIREBASE_CONFIG_PRESENT = !!(firebaseConfig && firebaseConfig.projectId);
if (FIREBASE_CONFIG_PRESENT) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
}

// Initialize Firestore eagerly — only when we have a valid config
// Use `any` here so service modules that import `db` can pass it into
// Firestore helpers even when TypeScript cannot statically prove non-null.
// Runtime checks elsewhere still guard against using `db` when it's null.
export const db: any = app ? getFirestore(app) : null;

// Lazy client-only services (auth, storage, analytics). These should only be used in browser code.
let _auth: Auth | null = null;
let _storage: StorageType | null = null;
let analytics: ReturnType<typeof getAnalytics> | undefined;

export const getClientAuth = (): Auth => {
    if (typeof window === 'undefined') {
        throw new Error('getClientAuth() called on the server. Use this only in client components or inside useEffect.');
    }
    if (!app) {
        throw new Error('Firebase app is not initialized. Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set for local dev.');
    }
    if (!_auth) _auth = getAuth(app);
    return _auth;
};

export const getClientStorage = (): StorageType => {
    if (typeof window === 'undefined') {
        throw new Error('getClientStorage() called on the server. Use this only in client components or inside useEffect.');
    }
    if (!app) {
        throw new Error('Firebase app is not initialized. Ensure NEXT_PUBLIC_FIREBASE_PROJECT_ID is set for local dev.');
    }
    if (!_storage) _storage = getStorage(app);
    return _storage;
};

// Note: named `auth`/`storage` exports are provided below via getters to avoid
// initializing client-only services during SSR. Do not define them twice.

export const initializeClientSideServices = async () => {
    if (typeof window === 'undefined') return;
    if (!app) return;

    // Enable offline persistence for Firestore
    if (db) {
        try {
            await enableMultiTabIndexedDbPersistence(db as any);
        } catch (err: unknown) {
            const e = err as { code?: string };
            if (e.code === 'failed-precondition') {
                console.warn('Firestore offline persistence failed: Multiple tabs open.');
            } else if (e.code === 'unimplemented') {
                console.warn('Firestore offline persistence not available in this browser.');
            }
        }
    }

    // Initialize auth and storage (lazy)
    try {
        if (!_auth) _auth = getAuth(app);
        if (!_storage) _storage = getStorage(app);
    } catch (err) {
        console.error('Failed to initialize client Firebase services', err);
    }

    // Enable Analytics (optional)
    try {
        const supported = await isAnalyticsSupported();
        if (supported && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && app) {
            analytics = getAnalytics(app as any);
        }
    } catch (error) {
        // Non-fatal
        console.warn('Analytics not available:', error);
    }
};

// Backwards-compatible helper for existing modules that import 'auth' directly:
// We avoid exporting a live 'auth' instance at module load time to prevent server-side calls.
export const authProxy = {
    get(): Auth {
        return getClientAuth();
    }
};
// Legacy-compatible named exports (safe lazy proxies). Many modules import `{ auth }`
// directly and expect an `Auth` instance. Instead of calling `getAuth()` at module
// load time (which breaks during SSR) or using `Object.defineProperty` (which can
// conflict with module bundlers and cause "Cannot redefine property" errors),
// we expose lightweight Proxy objects that forward property access to the real
// client Auth/Storage instances at runtime (and throw if used on the server).
//
// This preserves compatibility with existing call-sites like `signInWithEmailAndPassword(auth, ...)`.
export const auth = new Proxy({} as any, {
    get(_target, prop) {
        // Will throw a helpful error if called on the server or if app isn't initialized.
        const a = getClientAuth();
        return (a as any)[prop];
    },
    set(_target, prop, value) {
        const a = getClientAuth();
        (a as any)[prop] = value;
        return true;
    },
}) as Auth;

export const storage = new Proxy({} as any, {
    get(_target, prop) {
        const s = getClientStorage();
        return (s as any)[prop];
    },
    set(_target, prop, value) {
        const s = getClientStorage();
        (s as any)[prop] = value;
        return true;
    },
}) as StorageType;

