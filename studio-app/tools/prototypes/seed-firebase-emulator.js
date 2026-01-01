#!/usr/bin/env node
/*
  Seed script for Firestore emulator used by the Parent Portal prototype.
  Usage:
    FIRESTORE_EMULATOR_HOST=localhost:8080 node tools/prototypes/seed-firebase-emulator.js
  If FIRESTORE_EMULATOR_HOST is not set, the script will default to localhost:8080.
*/

const admin = require('firebase-admin');

const EMULATOR = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
if (!process.env.FIRESTORE_EMULATOR_HOST) {
  process.env.FIRESTORE_EMULATOR_HOST = EMULATOR;
  console.log(`FIRESTORE_EMULATOR_HOST not set — defaulting to ${EMULATOR}`);
}

const projectId = process.env.FIREBASE_PROJECT_ID || 'studio-project';
admin.initializeApp({ projectId });
const db = admin.firestore();

async function seed(){
  console.log('Seeding Firestore emulator...');

  // Student
  const studentId = 'STU2024001';
  await db.collection('students').doc(studentId).set({
    id: studentId,
    name: 'عمر الباهلي',
    grade: 'الثاني',
    className: 'A',
    email: 'obb@example.com',
    parentName: 'محمود علي',
    contact: '+966511234567',
    dob: '2014-05-12',
    address: 'الرياض - حي العليا',
    health: 'لا حساسية معروفة',
    status: 'active',
    enrollmentDate: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log('Student created:', studentId);

  // Announcements
  const anns = [
    { title: 'بداية التسجيل للفصل الجديد', content: 'يرجى إتمام تسجيل الطلاب قبل 10 يناير', audience: 'parents', grade: 'الثاني' },
    { title: 'اجتماع أولياء الأمور', content: 'سيعقد اجتماع أولياء الأمور في القاعة الكبرى', audience: 'parents', grade: null },
  ];
  for (const a of anns){
    const ref = db.collection('announcements').doc();
    await ref.set({ ...a, createdAt: admin.firestore.FieldValue.serverTimestamp(), id: ref.id });
    console.log('Announcement:', ref.id);
  }

  // Courses
  const mathRef = db.collection('courses').doc('COURSE_MATH_1');
  await mathRef.set({ id: 'COURSE_MATH_1', name: 'رياضيات', grade: 'الثاني', type: 'academic', teachers: [{ id: 'T1', name: 'أ. أحمد' }], createdAt: admin.firestore.FieldValue.serverTimestamp() });
  const arabRef = db.collection('courses').doc('COURSE_ARB_1');
  await arabRef.set({ id: 'COURSE_ARB_1', name: 'لغة عربية', grade: 'الثاني', type: 'academic', teachers: [{ id: 'T2', name: 'أ. فاطمة' }], createdAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log('Courses created');

  // Enrollments
  await db.collection('enrollments').doc('COURSE_MATH_1').set({ courseId: 'COURSE_MATH_1', studentIds: [studentId] });
  await db.collection('enrollments').doc('COURSE_ARB_1').set({ courseId: 'COURSE_ARB_1', studentIds: [studentId] });
  console.log('Enrollments created');

  // Assignments + Grades
  const assignRef = db.collection('assignments').doc();
  await assignRef.set({ id: assignRef.id, courseId: 'COURSE_MATH_1', title: 'تمارين أعداد', dueDate: '2025-12-18', totalPoints: 20 });
  await db.collection('grades').doc(assignRef.id).set({ id: assignRef.id, assignmentId: assignRef.id, studentGrades: { [studentId]: { score: 17 } } });
  console.log('Assignments and grades created');

  // Attendance (document per class+date)
  const today = new Date();
  const dateKey = today.toISOString().slice(0,10);
  const attendanceDocId = `${'الثاني'}_${'A'}_${dateKey}`;
  await db.collection('attendance').doc(attendanceDocId).set({
    id: attendanceDocId,
    grade: 'الثاني',
    className: 'A',
    date: dateKey,
    studentRecords: { [studentId]: 'present' },
    studentIds: [studentId]
  });
  console.log('Attendance created');

  // Conversations + Messages
  const convoId = ['PARENT', studentId].sort().join('_');
  await db.collection('conversations').doc(convoId).set({
    id: convoId,
    participantIds: [ 'PARENT', studentId ],
    participantDetails: [ { id: 'PARENT', name: 'ولي الأمر', avatar: '' }, { id: studentId, name: 'عمر الباهلي', avatar: '' } ],
    lastMessage: { text: 'مرحباً، كيف حاله؟', timestamp: admin.firestore.FieldValue.serverTimestamp(), senderId: 'PARENT' }
  });
  const msgRef = db.collection('messages').doc();
  await msgRef.set({ id: msgRef.id, conversationId: convoId, senderId: 'PARENT', text: 'مرحباً، كيف حاله؟', timestamp: admin.firestore.FieldValue.serverTimestamp() });
  console.log('Conversation and message created');

  console.log('Seeding complete.');
}

seed().catch(err=>{ console.error(err); process.exit(1); });
