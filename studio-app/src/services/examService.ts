
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
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import type { Exam } from "@/lib/types";

const EXAMS_COLLECTION = "exams";

export type NewExam = Omit<Exam, "id">;

/**
 * Adds a new exam to the schedule.
 * @param examData - The data for the new exam.
 * @returns The ID of the newly created exam.
 */
export const addExam = async (examData: NewExam): Promise<string> => {
  try {
    if (!db) throw new Error('Firestore is not initialized. Cannot add exam.');
    const docRef = await addDoc(collection(db, EXAMS_COLLECTION), examData);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error adding exam:", error);
    throw new Error("Failed to schedule exam.");
  }
};

/**
 * Gets all scheduled exams, ordered by date.
 * @returns An array of all exams.
 */
export const getExams = async (): Promise<Exam[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getExams() returning empty list.');
      return [];
    }
    const q = query(collection(db, EXAMS_COLLECTION), orderBy("examDate", "desc"));
    const querySnapshot = await getDocs(q);
    const exams: Exam[] = [];
    querySnapshot.forEach((doc) => {
      exams.push(doc.data() as Exam);
    });
    return exams;
  } catch (error) {
    console.error("Error getting exams:", error);
    throw new Error("Failed to get exams.");
  }
};

/**
 * Gets a single exam by ID.
 * @param examId - The ID of the exam.
 * @returns The exam, or null if not found.
 */
export const getExam = async (examId: string): Promise<Exam | null> => {
  try {
    if (!db) return null;
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as Exam) : null;
  } catch (error) {
    console.error("Error getting exam:", error);
    return null;
  }
};

/**
 * Updates an existing exam.
 * @param examId - The ID of the exam.
 * @param updates - Partial exam data to update.
 */
export const updateExam = async (examId: string, updates: Partial<NewExam>): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized. Cannot update exam.');
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating exam:", error);
    throw new Error("Failed to update exam.");
  }
};

/**
 * Deletes an exam.
 * @param examId - The ID of the exam.
 */
export const deleteExam = async (examId: string): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized. Cannot delete exam.');
    const docRef = doc(db, EXAMS_COLLECTION, examId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting exam:", error);
    throw new Error("Failed to delete exam.");
  }
};
