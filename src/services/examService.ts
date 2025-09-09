
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
