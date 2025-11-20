
import { db } from "@/lib/firebase-client";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import type { ParentAccess } from "@/lib/types";

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
    // Generate a secure random token
    const token = crypto.randomUUID();
    
    const accessRecord: Omit<ParentAccess, 'createdAt'> = {
      id: token,
      studentId,
      parentId: opts?.parentId,
      parentName: opts?.parentName,
    };
    if (!db) throw new Error('Firestore not initialized. Cannot generate parent access token.');
    const tokenRef = doc(db, PARENT_ACCESS_COLLECTION, token);
    await setDoc(tokenRef, { ...accessRecord, createdAt: serverTimestamp() });

    // Also save the token reference on the student's access doc for easy lookup
    const studentAccessRef = doc(db, `${PARENT_ACCESS_COLLECTION}-by-student`, studentId);
    await setDoc(studentAccessRef, { token });

    return token;
  } catch (error) {
    console.error("Error generating parent access token:", error);
    throw new Error("Failed to generate parent access token.");
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
      console.warn('Firestore not initialized. getParentAccessLink() returning null.');
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
      console.warn('Firestore not initialized. getParentAccessRecord() returning null.');
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
      console.warn('Firestore not initialized. validateParentAccessToken() returning null.');
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
