/**
 * Migration script to populate `monthlyFee` for support courses.
 *
 * Usage (safe; will prompt):
 * 1. Create a Firebase service account JSON and set GOOGLE_APPLICATION_CREDENTIALS to its path.
 * 2. Install dependencies (if not already): npm install firebase-admin
 * 3. Run: node --loader ts-node/esm scripts/populate-support-monthly-fees.ts
 *
 * NOTE: This script will update Firestore. Review and test in a staging project before running in production.
 */

import admin from 'firebase-admin';

type CourseDoc = {
  id: string;
  type?: string;
  monthlyFee?: number;
};

async function main() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of a Firebase service account JSON before running this script.');
    process.exit(1);
  }

  admin.initializeApp({ credential: admin.credential.applicationDefault() });
  const db = admin.firestore();

  console.log('Fetching support courses...');
  const coursesSnap = await db.collection('courses').where('type', '==', 'support').get();
  console.log(`Found ${coursesSnap.size} support course(s).`);

  if (coursesSnap.empty) {
    console.log('No support courses found. Exiting.');
    return;
  }

  // Default monthly fee to apply if missing. Change as needed.
  const DEFAULT_MONTHLY_FEE = 50;

  const batch = db.batch();
  let updates = 0;

  coursesSnap.forEach(doc => {
    const data = doc.data() as CourseDoc;
    if (typeof data.monthlyFee !== 'number') {
      console.log(`Will set monthlyFee=${DEFAULT_MONTHLY_FEE} for course ${doc.id}`);
      batch.update(doc.ref, { monthlyFee: DEFAULT_MONTHLY_FEE });
      updates++;
    }
  });

  if (updates === 0) {
    console.log('All support courses already have monthlyFee set. No updates necessary.');
    return;
  }

  console.log(`Committing ${updates} updates...`);
  await batch.commit();
  console.log('Migration complete. Updated courses:', updates);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
