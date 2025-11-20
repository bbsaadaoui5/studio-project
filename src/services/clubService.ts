import { db } from '@/lib/firebase-client';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { getSupportCourses } from './courseService';
import { enrollStudentsInCourse } from './enrollmentService';

/**
 * Returns support/extracurricular courses (clubs)
 */
export const getClubs = async () => {
  return getSupportCourses();
}

/**
 * Create a signup request for a student to join a club. Admins can later approve.
 */
export const createClubSignupRequest = async (studentId: string, courseId: string, parentName?: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const col = collection(db, 'clubSignupRequests');
  const docRef = await addDoc(col, { studentId, courseId, parentName: parentName || null, status: 'pending', createdAt: new Date().toISOString() });
  return docRef.id;
}

/**
 * Fetch club signup requests for admin review, newest first.
 */
export const getClubSignupRequests = async () => {
  if (!db) {
    console.warn('Firestore not initialized. getClubSignupRequests() returning empty list.');
    return [];
  }
  const q = query(collection(db, 'clubSignupRequests'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const requests: any[] = [];
  snap.forEach(d => requests.push({ id: d.id, ...d.data() }));
  return requests;
}

/**
 * Update the status of a club signup request. If approved, enroll the student in the club/course.
 */
export const updateClubSignupRequestStatus = async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(db, 'clubSignupRequests', requestId);
  await updateDoc(ref, { status });

  if (status === 'approved') {
    // fetch request to get studentId/courseId
    const reqSnap = await getDocs(query(collection(db, 'clubSignupRequests'))); // fallback to fetch doc
    // try to read specific doc instead to avoid extra cost
    try {
      const specific = await (await import('firebase/firestore')).getDoc(ref);
      if (specific && specific.exists()) {
        const data: any = specific.data();
        if (data?.studentId && data?.courseId) {
          await enrollStudentsInCourse(data.courseId, [data.studentId]);
        }
      }
    } catch (e) {
      // best-effort: ignore enrollment failure here, admin can re-enroll manually
      console.error('Failed to auto-enroll student after club approval:', e);
    }
  }
}
