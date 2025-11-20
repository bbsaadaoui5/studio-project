"use client";

import { useEffect, useState } from "react";

function maskProjectId(id: string | null) {
  if (!id) return null;
  if (id.length <= 6) return id;
  return `${id.slice(0, 4)}...${id.slice(-2)}`;
}

export default function FirebaseNotConfiguredBanner() {
  const [missing, setMissing] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import("@/lib/firebase-client");
        // If db is null or undefined, consider Firebase not configured for this runtime
        if (mounted && !mod.db) setMissing(true);
        if (mounted && typeof mod.getPublicFirebaseProjectId === 'function') {
          try {
            const id = mod.getPublicFirebaseProjectId();
            setProjectId(id);
          } catch (e) {
            // ignore
          }
        }
      } catch (err) {
        if (mounted) setMissing(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!missing) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 text-yellow-800">
      <strong>Firebase not configured</strong>
      <div className="text-sm">
        The app could not initialize Firestore locally. Add your Firebase public config to <code>.env.local</code> (NEXT_PUBLIC_FIREBASE_*) and restart the dev server to see your students and staff.
      </div>
      {projectId && (
        <div className="mt-2 text-xs text-yellow-700">Detected project id: <code>{maskProjectId(projectId)}</code></div>
      )}
    </div>
  );
}
