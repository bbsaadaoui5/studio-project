
import { db } from "@/lib/firebase-client";
import { collection, doc, setDoc, getDoc, addDoc, query, where, getDocs, updateDoc } from "firebase/firestore";
import type { Grade, Assignment, ExamScore } from "@/lib/types";

const ASSIGNMENT_COLLECTION = "assignments";
const GRADE_COLLECTION = "grades";
const EXAM_SCORE_COLLECTION = "examScores";

export type NewAssignment = Omit<Assignment, 'id'>;

/**
 * Adds a new assignment to a course.
 * @param assignmentData - The data for the new assignment.
 * @returns The ID of the newly created assignment.
 */
export const addAssignment = async (assignmentData: NewAssignment): Promise<string> => {
    try {
        if (!db) throw new Error('Firestore not initialized. Cannot add assignment.');
        const docRef = await addDoc(collection(db, ASSIGNMENT_COLLECTION), assignmentData);
        await updateDoc(docRef, { id: docRef.id });
        return docRef.id;
    } catch (error) {
        console.error("Error adding assignment:", error);
        throw new Error("Failed to add assignment.");
    }
};

/**
 * Gets all assignments for a specific course.
 * @param courseId - The ID of the course.
 * @returns An array of assignments.
 */
export const getAssignmentsForCourse = async (courseId: string): Promise<Assignment[]> => {
    try {
        if (!db) {
            console.warn('Firestore not initialized. getAssignmentsForCourse() returning empty list.');
            return [];
        }
        const q = query(collection(db, ASSIGNMENT_COLLECTION), where("courseId", "==", courseId));
        const querySnapshot = await getDocs(q);
        const assignments: Assignment[] = [];
        querySnapshot.forEach((doc) => {
            assignments.push({ id: doc.id, ...doc.data() } as Assignment);
        });
        return assignments;
    } catch (error) {
        console.error("Error getting assignments:", error);
        throw new Error("Failed to get assignments for course.");
    }
};


/**
 * Saves or updates grades for a specific assignment.
 * @param assignmentId - The ID of the assignment.
 * @param grades - An object mapping student IDs to their scores.
 */
export const saveGrades = async (assignmentId: string, studentGrades: Grade['studentGrades']): Promise<void> => {
  try {
        if (!db) throw new Error('Firestore not initialized. Cannot save grades.');
        const gradeRef = doc(db, GRADE_COLLECTION, assignmentId);
        await setDoc(gradeRef, { assignmentId, studentGrades }, { merge: true });
  } catch (error) {
    console.error("Error saving grades: ", error);
    throw new Error("Failed to save grades.");
  }
};

/**
 * Gets the grades for a specific assignment.
 * @param assignmentId - The ID of the assignment.
 * @returns The grade record, or null if not found.
 */
export const getGrades = async (assignmentId: string): Promise<Grade | null> => {
    try {
        if (!db) {
            console.warn('Firestore not initialized. getGrades() returning null.');
            return null;
        }
        const docRef = doc(db, GRADE_COLLECTION, assignmentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Grade;
        }
        return null;
    } catch (error) {
        console.error("Error getting grades:", error);
        throw new Error("Failed to get grades data.");
    }
}

/**
 * Calculates the final grade percentage for a student in a specific course.
 * @param courseId - The ID of the course.
 * @param studentId - The ID of the student.
 * @returns The final grade as a percentage, or null if no grades are available.
 */
export const getStudentGradeForCourse = async (courseId: string, studentId: string): Promise<number | null> => {
    try {
        const assignments = await getAssignmentsForCourse(courseId);
        if (assignments.length === 0) return null;

        let totalScore = 0;
        let totalPoints = 0;

        for (const assignment of assignments) {
            const gradeData = await getGrades(assignment.id);
            if (!gradeData || !gradeData.studentGrades) continue;
            
            const studentGrade = gradeData.studentGrades[studentId];
            
            if (studentGrade && typeof studentGrade.score === 'number') {
                totalScore += studentGrade.score;
                totalPoints += assignment.totalPoints;
            }
        }
        
        if (totalPoints === 0) {
            return null; // Avoid division by zero
        }

        return (totalScore / totalPoints) * 100;
    } catch (error) {
        console.error("Error calculating student grade:", error);
        return null; 
    }
};

/**
 * Saves or updates scores for a specific exam.
 * @param examId - The ID of the exam.
 * @param studentScores - An object mapping student IDs to their scores.
 */
export const saveExamScores = async (examId: string, studentScores: ExamScore['studentScores']): Promise<void> => {
  try {
        if (!db) throw new Error('Firestore not initialized. Cannot save exam scores.');
        const scoreRef = doc(db, EXAM_SCORE_COLLECTION, examId);
        await setDoc(scoreRef, { examId, studentScores }, { merge: true });
  } catch (error) {
    console.error("Error saving exam scores: ", error);
    throw new Error("Failed to save exam scores.");
  }
};

/**
 * Gets the scores for a specific exam.
 * @param examId - The ID of the exam.
 * @returns The exam score record, or null if not found.
 */
export const getExamScores = async (examId: string): Promise<ExamScore | null> => {
    try {
        if (!db) {
            console.warn('Firestore not initialized. getExamScores() returning null.');
            return null;
        }
        const docRef = doc(db, EXAM_SCORE_COLLECTION, examId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as ExamScore;
        }
        return null;
    } catch (error) {
        console.error("Error getting exam scores:", error);
        throw new Error("Failed to get exam scores data.");
    }
}
