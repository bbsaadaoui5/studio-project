import { db } from '@/lib/firebase-client';
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { getSupportCourses } from './courseService';
import { enrollStudentsInCourse } from './enrollmentService';

/**
 * Wrapper to return support/extracurricular courses (same as clubs)
 */
export const getSupportPrograms = async () => {
  return getSupportCourses();
}

/**
 * Create a signup request for a student to join a support program/course.
 * Admins can later approve and enroll the student.
 */
export const createSupportSignupRequest = async (studentId: string, courseId: string, parentName?: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const col = collection(db, 'supportSignupRequests');
  const docRef = await addDoc(col, { studentId, courseId, parentName: parentName || null, status: 'pending', createdAt: new Date().toISOString() });
  return docRef.id;
}

/**
 * Fetch support signup requests for admin review, newest first.
 */
export const getSupportSignupRequests = async () => {
  if (!db) {
    console.warn('Firestore not initialized. getSupportSignupRequests() returning empty list.');
    return [];
  }
  const q = query(collection(db, 'supportSignupRequests'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const requests: any[] = [];
  snap.forEach(d => requests.push({ id: d.id, ...d.data() }));
  return requests;
}

/**
 * Update the status of a support signup request. If approved, enroll the student in the support course.
 */
export const updateSupportSignupRequestStatus = async (requestId: string, status: 'approved' | 'rejected'): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(db, 'supportSignupRequests', requestId);
  await updateDoc(ref, { status });

  if (status === 'approved') {
    try {
      const specific = await (await import('firebase/firestore')).getDoc(ref);
      if (specific && specific.exists()) {
        const data: any = specific.data();
        if (data?.studentId && data?.courseId) {
          await enrollStudentsInCourse(data.courseId, [data.studentId]);
        }
      }
    } catch (e) {
      console.error('Failed to auto-enroll student after support approval:', e);
    }
  }
}
