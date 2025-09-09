
import { db } from "@/lib/firebase-client";
import { collection, query, where, getDocs, addDoc, updateDoc } from "firebase/firestore";
import type { TimetableEntry } from "@/lib/types";

const TIMETABLE_COLLECTION = "timetables";

/**
 * Gets the weekly timetable for a specific class.
 * @param grade - The grade of the class.
 * @param className - The name of the class (e.g., "A").
 * @returns An array of timetable entries for the week.
 */
export const getTimetableForClass = async (grade: string, className: string): Promise<TimetableEntry[]> => {
  try {
    const q = query(collection(db, TIMETABLE_COLLECTION), where("grade", "==", grade), where("className", "==", className));
    const querySnapshot = await getDocs(q);
    const timetable: TimetableEntry[] = [];
    querySnapshot.forEach((doc) => {
      timetable.push({ id: doc.id, ...doc.data() } as TimetableEntry);
    });
    return timetable;
  } catch (error) {
    console.error("Error getting timetable:", error);
    throw new Error("Failed to get timetable.");
  }
};


/**
 * Gets the weekly timetable for a specific teacher.
 * @param teacherName - The name of the teacher.
 * @returns An array of timetable entries for that teacher.
 */
export const getTimetableForTeacher = async (teacherName: string): Promise<TimetableEntry[]> => {
  try {
    const q = query(collection(db, TIMETABLE_COLLECTION), where("teacherName", "==", teacherName));
    const querySnapshot = await getDocs(q);
    const timetable: TimetableEntry[] = [];
    querySnapshot.forEach((doc) => {
      timetable.push({ id: doc.id, ...doc.data() } as TimetableEntry);
    });
    return timetable;
  } catch (error) {
    console.error("Error getting timetable for teacher:", error);
    throw new Error("Failed to get timetable for teacher.");
  }
};


/**
 * Adds a new entry to the timetable, checking for teacher conflicts.
 * @param entry - The timetable entry to add.
 * @returns The ID of the newly created timetable entry.
 * @throws An error if the teacher is already scheduled at that time.
 */
export const addTimetableEntry = async (entry: Omit<TimetableEntry, 'id'>): Promise<string> => {
  try {
    // Check for teacher conflict
    const conflictQuery = query(
      collection(db, TIMETABLE_COLLECTION),
      where("teacherName", "==", entry.teacherName),
      where("day", "==", entry.day),
      where("timeSlot", "==", entry.timeSlot)
    );
    
    const conflictSnapshot = await getDocs(conflictQuery);
    if (!conflictSnapshot.empty) {
        throw new Error(`Teacher ${entry.teacherName} is already scheduled at this time.`);
    }

    const docRef = await addDoc(collection(db, TIMETABLE_COLLECTION), entry);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error adding timetable entry:", error);
    // Re-throw the original error message if it's a conflict, otherwise a generic one.
    if (error instanceof Error && error.message.includes("is already scheduled")) {
        throw error;
    }
    throw new Error("Failed to add timetable entry.");
  }
};
