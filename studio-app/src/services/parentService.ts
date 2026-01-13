
import { db } from "@/lib/firebase-client";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { ParentAccess } from "@/lib/types";
import { isDevMockEnabled, getMockStudents } from "@/lib/dev-mock";

const PARENT_ACCESS_COLLECTION = "parentAccess";

/**
 * Generates a secure, unique access token for a parent.
 * This token is stored and mapped to a student ID.
 * @param studentId - The ID of the student.
 * @returns The generated access token.
 */
/**
 * Generate a parent access token and optionally attach parent identity info.
 * @param studentId - student id the token will be bound to
 * @param opts.parentId - optional parent user id (auth uid)
 * @param opts.parentName - optional parent display name to show in parent portal/messages
 */
export const generateParentAccessToken = async (studentId: string, opts?: { parentId?: string; parentName?: string }): Promise<string> => {
  try {
    // Dev fallback: return a stable test token when Firestore isn't available and dev mocks are enabled
    if (!db) {
      if (isDevMockEnabled()) {
        // Return a simple dev token that maps to a mock student in `validateParentAccessToken`
        console.warn('Dev mode: generateParentAccessToken returning test-token');
        return 'test-token';
      }
      throw new Error('Firestore not initialized. Cannot generate parent access token.');
    }

    // Production path: Generate a short, secure random token (8 characters)
    // Using base36 (0-9, a-z) for easy typing/reading
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    console.log(`Generating token "${token}" for student "${studentId}"`);

    // Build the access record and only include defined fields (Firestore rejects `undefined` values)
    const accessRecord: Partial<Omit<ParentAccess, 'createdAt'>> = {
      id: token,
      studentId,
    };
    if (opts?.parentId) accessRecord.parentId = opts.parentId;
    if (opts?.parentName) accessRecord.parentName = opts.parentName;
    
    const tokenRef = doc(db, PARENT_ACCESS_COLLECTION, token);
    await setDoc(tokenRef, { ...accessRecord, createdAt: serverTimestamp() });
    console.log(`Token document created at parentAccess/${token}`);

    // Also save the token reference on the student's access doc for easy lookup
    const studentAccessRef = doc(db, `${PARENT_ACCESS_COLLECTION}-by-student`, studentId);
    await setDoc(studentAccessRef, { token });
    console.log(`Student reference created at parentAccess-by-student/${studentId}`);

    return token;
  } catch (error) {
    console.error("Error generating parent access token:", error);
    throw error; // Re-throw so the caller knows what happened
  }
};

/**
 * Retrieves the currently active parent access link for a student.
 * @param studentId - The ID of the student.
 * @returns The full access link, or null if one doesn't exist.
 */
export const getParentAccessLink = async (studentId: string): Promise<string | null> => {
    try {
    if (!db) {
      console.warn('Firestore not initialized. getParentAccessLink() using dev fallback.');
      if (isDevMockEnabled()) {
        return `${window.location.origin}/parent-portal/test-token`;
      }
      return null;
    }
    const studentAccessRef = doc(db, `${PARENT_ACCESS_COLLECTION}-by-student`, studentId);
    const docSnap = await getDoc(studentAccessRef);
        if (docSnap.exists()) {
            const token = docSnap.data().token;
            // This assumes the app is hosted at the root. Adjust if needed.
            return `${window.location.origin}/parent-portal/${token}`;
        }
        return null;
    } catch (error) {
        console.error("Error getting parent access link:", error);
        return null;
    }
}

/**
 * Retrieve the full access record for a token (includes parentName if set)
 */
export const getParentAccessRecord = async (token: string): Promise<ParentAccess | null> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getParentAccessRecord() using dev fallback.');
      if (isDevMockEnabled()) {
        // In dev mode we return a simple record when token === 'test-token'
        if (token === 'test-token') {
          const students = await getMockStudents();
          const mock = students[0];
          return mock ? ({ id: 'test-token', studentId: mock.id, parentName: (mock as any).parentName } as ParentAccess) : null;
        }
        return null;
      }
      return null;
    }
    const docRef = doc(db, PARENT_ACCESS_COLLECTION, token);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...(docSnap.data() as any) } as ParentAccess;
  } catch (error) {
    console.error('Error getting parent access record:', error);
    return null;
  }
}


/**
 * Validates a parent access token and returns the associated student ID.
 * @param token - The access token from the URL.
 * @returns The student ID, or null if the token is invalid or expired.
 */
export const validateParentAccessToken = async (token: string): Promise<string | null> => {
    try {
    if (!db) {
      console.warn('Firestore not initialized. validateParentAccessToken() using dev fallback.');
      if (isDevMockEnabled()) {
        // Accept a simple test token in dev that maps to the first mock student
        if (!token) return null;
        if (token === 'test-token') {
          const students = await getMockStudents();
          const mock = students[0];
          return mock?.id || null;
        }
        // Also accept tokens with the format `test-token-<studentId>` to target a specific mock student
        if (token.startsWith('test-token-')) {
          const parts = token.split('-');
          const sid = parts.slice(2).join('-');
          // verify it exists among mocks
          const students = await getMockStudents();
          const found = students.find(s => String(s.id) === sid);
          return found ? found.id : null;
        }
        return null;
      }
      return null;
    }
    const docRef = doc(db, PARENT_ACCESS_COLLECTION, token);
    const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            // Optional: Add token expiration logic here if needed
            const data = docSnap.data() as ParentAccess;
            return data.studentId;
        }
        return null;
    } catch (error) {
        console.error("Error validating token:", error);
        return null;
    }
};
