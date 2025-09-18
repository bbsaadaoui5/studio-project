// TEMPORARILY DISABLED - Firebase initialization
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables
export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""
};

// Mock Firebase for temporary build testing
export const db = {
  // Mock basic firestore methods
  collection: (path: string) => ({
    doc: (id: string) => ({
      get: async () => ({ 
        exists: true, 
        data: () => ({ id, name: "Mock Data" }),
        id 
      }),
      set: async (data: any) => ({ id, ...data }),
      update: async (data: any) => ({ id, ...data })
    }),
    get: async () => ({ 
      docs: [{ 
        data: () => ({ name: "Mock Item" }),
        id: "mock-id" 
      }] 
    }),
    where: () => ({
      get: async () => ({ docs: [] })
    })
  })
} as any;

// Initialize Firebase - COMMENTED OUT FOR TESTING
// const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
// export const db = getFirestore(app);