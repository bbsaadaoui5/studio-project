// Diagnostic: Fees system health check
// Run with: npx ts-node ./tools/fees-diagnostic.ts
// Reports: total students, active students, students missing grade/enrollmentDate, payments per student, fee structure availability

// Import modules dynamically to work in ESM/ts-node environments
let getStudents: any;
let getPaymentsForStudent: any;
let getFeeStructureForGrade: any;
let getCombinedMonthlyDueForStudent: any;
let getSettings: any;

async function main() {
  console.log('Starting fees diagnostic...');
  // Lazy-load Firebase client and Firestore helpers using dynamic import to support ESM runtime
  const { db } = await import('../src/lib/firebase-client.ts');
  const { collection, getDocs, query, where, doc, getDoc } = await import('firebase/firestore');

  // If Firestore isn't initialized (no env or emulator), fall back to a small inline mock
  const useMock = !db;
  if (useMock) console.warn('Firestore not initialized — using inline mock data for diagnostics.');

  // Read settings from Firestore if available, else default
  let academicYear: string = new Date().getFullYear().toString();
  if (db) {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDoc && settingsDoc.exists()) {
        const sdata: any = settingsDoc.data();
        academicYear = sdata.academicYear || academicYear;
      }
    } catch (err) {
      console.warn('Could not read settings:', err);
    }
  }
  console.log('Academic year (from settings or fallback):', academicYear);

  // Fetch students directly from Firestore or use inline mock
  let students: any[] = [];
  if (db) {
    const studentsSnapshot = await getDocs(collection(db, 'students'));
    studentsSnapshot.forEach(d => {
      const data = d.data();
      if (data.enrollmentDate && typeof data.enrollmentDate.toDate === 'function') {
        data.enrollmentDate = data.enrollmentDate.toDate().toISOString();
      }
      students.push({ id: d.id, ...data });
    });
  } else {
    // Minimal inline mock so diagnostics can run without Firestore/emulator
    students = [
      { id: 'STU-MOCK-1', name: 'Ali Haddad', fullName: 'Ali Haddad', grade: '3', className: 'A', status: 'active', enrollmentDate: new Date().toISOString() },
      { id: 'STU-MOCK-2', name: 'Sara Khalil', fullName: 'Sara Khalil', grade: '2', className: 'B', status: 'active', enrollmentDate: new Date().toISOString() },
    ];
  }
  console.log('Total students:', students.length);
  const active = students.filter((s: any) => s.status === 'active');
  console.log('Active students:', active.length);
  const missingGrade = students.filter((s: any) => !s.grade || s.grade === 'N/A');
  console.log('Students missing grade or with N/A:', missingGrade.length);
  const missingEnrollment = students.filter((s: any) => !s.enrollmentDate);
  console.log('Students missing enrollmentDate:', missingEnrollment.length);

  // For performance, cap per-student detailed output
  const MAX_DETAILS = 200;
  let detailsCount = 0;

  console.log('\nPer-student summary (first', Math.min(active.length, MAX_DETAILS), 'active students):');
  for (const s of active as any[]) {
    if (detailsCount >= MAX_DETAILS) break;

    // Payments for student — only query Firestore when available, otherwise use empty mock
    let payments: any[] = [];
    if (db) {
      try {
        const paymentsSnap = await getDocs(query(collection(db, 'payments'), where('studentId', '==', s.id)));
        payments = paymentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('Failed to fetch payments for', s.id, err);
      }
    } else {
      payments = [];
    }
    const paymentTotal = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    // Fee structure for grade (try doc with id `${grade}-${academicYear}`)
    let feeStruct: any = null;
    if (db && s.grade && s.grade !== 'N/A') {
      try {
        const fsDoc = await getDoc(doc(db, 'feeStructures', `${s.grade}-${academicYear}`));
        if (fsDoc.exists()) feeStruct = fsDoc.data();
      } catch (err) {
        console.warn('Failed to fetch fee structure for', s.grade, err);
      }
    } else {
      feeStruct = null;
    }

    const gradeMonthly = feeStruct?.monthlyAmount || 0;

    console.log('---');
    console.log(`id: ${s.id}`);
    console.log(`name: ${s.name || s.fullName || '[no name]'}`);
    console.log(`grade: ${s.grade || '[no grade]'}`);
    console.log(`className: ${s.className || '[no className]'}`);
    console.log(`status: ${s.status || '[no status]'}`);
    console.log(`enrollmentDate: ${s.enrollmentDate || '[no enrollmentDate]'}`);
    console.log(`fee structure found: ${feeStruct ? 'yes' : 'no'}`);
    console.log(`gradeMonthly: ${gradeMonthly}`);
    console.log(`payments count: ${payments.length}, totalPaid: ${paymentTotal}`);

    detailsCount++;
  }

  if (active.length > MAX_DETAILS) console.log(`\n(Only first ${MAX_DETAILS} active students shown. Increase MAX_DETAILS in script to show more.)`);

  console.log('\nDiagnostic complete.');
}

main().catch(err => { console.error('Diagnostic failed:', err); process.exit(1); });

// Ensure this file is treated as a module to avoid global-scope name collisions
export {};
