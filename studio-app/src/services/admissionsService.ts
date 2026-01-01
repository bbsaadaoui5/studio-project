
import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import type { AdmissionApplication } from "@/lib/types";

const ADMISSIONS_COLLECTION = "admissions";

export type NewApplication = Omit<AdmissionApplication, 'id' | 'status' | 'applicationDate'>;

/**
 * Adds a new admission application.
 * @param applicationData - The data for the new application.
 * @returns The ID of the newly created application.
 */
export const addAdmissionApplication = async (applicationData: NewApplication): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized. Cannot add admission application.');
  const batch = writeBatch(db);
  const newDocRef = doc(collection(db, ADMISSIONS_COLLECTION));

  const newApplication = {
    ...applicationData,
    id: newDocRef.id,
    applicationDate: serverTimestamp(),
    status: "pending" as const,
  };
  batch.set(newDocRef, newApplication);

  try {
    await batch.commit();
    return newDocRef.id;
  } catch (error) {
    console.error("Error adding admission application:", error);
    throw new Error("Failed to add admission application.");
  }
};

/**
 * Gets all admission applications, sorted by date.
 * @returns An array of all admission applications.
 */
export const getAdmissionApplications = async (): Promise<AdmissionApplication[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getAdmissionApplications() returning empty list.');
      return [];
    }
    const q = query(collection(db, ADMISSIONS_COLLECTION), orderBy("applicationDate", "desc"));
    const querySnapshot = await getDocs(q);
    const applications: AdmissionApplication[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string
      if (data.applicationDate && typeof data.applicationDate.toDate === 'function') {
        data.applicationDate = data.applicationDate.toDate().toISOString();
      }
      applications.push(data as AdmissionApplication);
    });
    return applications;
  } catch (error) {
    console.error("Error getting admission applications:", error);
    throw new Error("Failed to get admission applications.");
  }
};

/**
 * Updates the status of an admission application.
 * @param applicationId - The ID of the application to update.
 * @param status - The new status.
 */
export const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected'): Promise<void> => {
    try {
    if (!db) throw new Error('Firestore is not initialized. Cannot update application status.');
    const appRef = doc(db, ADMISSIONS_COLLECTION, applicationId);
    await updateDoc(appRef, { status });
    } catch (error) {
        console.error("Error updating application status:", error);
        throw new Error("Failed to update application status.");
    }
}
