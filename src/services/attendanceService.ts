
import { db } from "@/lib/firebase-client";
import { doc, setDoc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import type { AttendanceRecord, StaffAttendanceRecord } from "@/lib/types";

const STUDENT_ATTENDANCE_COLLECTION = "attendance";
const STAFF_ATTENDANCE_COLLECTION = "staffAttendance";


// The ID for a student attendance document will be a composite key `grade_className_date`
const getStudentDocId = (grade: string, className: string, date: string) => `${grade}_${className}_${date}`;

/**
 * Saves or updates a student attendance record for a specific class and date.
 * @param record - The attendance record to save.
 */
export const saveAttendance = async (record: Omit<AttendanceRecord, 'id'>): Promise<void> => {
  try {
        if (!db) throw new Error('Firestore is not initialized. Cannot save attendance.');
    const docId = getStudentDocId(record.grade, record.className, record.date);
    const attendanceRef = doc(db, STUDENT_ATTENDANCE_COLLECTION, docId);
    // Add student IDs to the top level for efficient querying
    const studentIds = Object.keys(record.studentRecords);
    await setDoc(attendanceRef, { ...record, studentIds }, { merge: true });
  } catch (error) {
    console.error("Error saving student attendance: ", error);
    throw new Error("Failed to save student attendance.");
  }
};

/**
 * Gets the student attendance record for a specific class and date.
 * @param grade - The grade of the class.
 * @param className - The name of the class.
 * @param date - The date string in "yyyy-MM-dd" format.
 * @returns The attendance record, or null if not found.
 */
export const getAttendance = async (grade: string, className: string, date: string): Promise<AttendanceRecord | null> => {
    try {
        if (!db) {
            console.warn('Firestore not initialized. getAttendance() returning null.');
            return null;
        }
        const docId = getStudentDocId(grade, className, date);
        const docRef = doc(db, STUDENT_ATTENDANCE_COLLECTION, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as AttendanceRecord;
        }
        return null;
    } catch (error) {
        console.error("Error getting student attendance:", error);
        throw new Error("Failed to get student attendance data.");
    }
}

/**
 * Fetches all attendance records for a specific student.
 * @param studentId The ID of the student.
 * @returns A promise that resolves to an array of attendance records for the student.
 */
export const getAttendanceForStudent = async (studentId: string): Promise<{ date: string; status: string }[]> => {
    try {
        if (!db) {
            console.warn('Firestore not initialized. getAttendanceForStudent() returning empty list.');
            return [];
        }
        // Get ALL attendance records and filter client-side (temporary fix)
        const querySnapshot = await getDocs(collection(db, STUDENT_ATTENDANCE_COLLECTION));
        
        const records: { date: string; status: string }[] = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data() as AttendanceRecord;
            if (data.studentRecords && data.studentRecords[studentId]) {
                records.push({
                    date: data.date,
                    status: data.studentRecords[studentId]
                });
            }
        });
        return records;
    } catch (error) {
        console.error("Error getting attendance for student:", error);
        throw new Error("Failed to get attendance for student.");
    }
};


// --- Staff Attendance ---

/**
 * Saves or updates a staff attendance record for a specific date.
 * @param record - The staff attendance record to save.
 */
export const saveStaffAttendance = async (record: Omit<StaffAttendanceRecord, 'id'>): Promise<void> => {
  try {
        if (!db) throw new Error('Firestore is not initialized. Cannot save staff attendance.');
    const docRef = doc(db, STAFF_ATTENDANCE_COLLECTION, record.date);
    await setDoc(docRef, record, { merge: true });
  } catch (error) {
    console.error("Error saving staff attendance: ", error);
    throw new Error("Failed to save staff attendance.");
  }
};

/**
 * Gets the staff attendance record for a specific date.
 * @param date - The date string in "yyyy-MM-dd" format.
 * @returns The staff attendance record, or null if not found.
 */
export const getStaffAttendance = async (date: string): Promise<StaffAttendanceRecord | null> => {
    try {
        if (!db) {
            console.warn('Firestore not initialized. getStaffAttendance() returning null.');
            return null;
        }
        const docRef = doc(db, STAFF_ATTENDANCE_COLLECTION, date);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as StaffAttendanceRecord;
        }
        return null;
    } catch (error) {
        console.error("Error getting staff attendance:", error);
        throw new Error("Failed to get staff attendance data.");
    }
}
