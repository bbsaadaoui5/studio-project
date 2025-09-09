
import { db } from "@/lib/firebase-client";
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, query, where, getDocs, writeBatch, arrayRemove } from "firebase/firestore";
import type { Enrollment } from "@/lib/types";

// Firestore collection name
const ENROLLMENT_COLLECTION = "enrollments";

/**
 * Enrolls students in a specific course.
 * If an enrollment document for the course already exists, it adds the new students to it.
 * If not, it creates a new enrollment document.
 * @param courseId - The ID of the course.
 * @param studentIds - An array of student IDs to enroll.
 * @returns A promise that resolves when the operation is complete.
 */
export const enrollStudentsInCourse = async (courseId: string, studentIds: string[]): Promise<void> => {
  try {
    const enrollmentRef = doc(db, ENROLLMENT_COLLECTION, courseId);
    const docSnap = await getDoc(enrollmentRef);

    if (docSnap.exists()) {
      // If the document exists, set the studentIds to the new array.
      // This allows for both adding and removing students.
      await setDoc(enrollmentRef, { studentIds: studentIds }, { merge: true });
    } else {
      // If the document does not exist, create it.
      await setDoc(enrollmentRef, {
        courseId: courseId,
        studentIds: studentIds,
      });
    }
  } catch (error) {
    console.error("Error enrolling students: ", error);
    throw new Error("Failed to enroll students.");
  }
};


/**
 * Enrolls a single student in multiple courses.
 * This function iterates through all courses and updates the student's enrollment status.
 * @param studentId The ID of the student.
 * @param courseIds An array of course IDs the student should be enrolled in.
 */
export const enrollStudentInCourses = async (studentId: string, courseIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    try {
        const allCoursesSnapshot = await getDocs(collection(db, ENROLLMENT_COLLECTION));
        
        allCoursesSnapshot.forEach(doc => {
            const enrollment = doc.data() as Enrollment;
            const courseId = doc.id;
            const enrollmentRef = doc.ref;

            const shouldBeEnrolled = courseIds.includes(courseId);
            const isCurrentlyEnrolled = enrollment.studentIds.includes(studentId);

            if (shouldBeEnrolled && !isCurrentlyEnrolled) {
                // Add the student
                batch.update(enrollmentRef, { studentIds: arrayUnion(studentId) });
            } else if (!shouldBeEnrolled && isCurrentlyEnrolled) {
                // Remove the student
                batch.update(enrollmentRef, { studentIds: arrayRemove(studentId) });
            }
        });

        // Also handle courses that might not have an enrollment document yet.
        for (const courseId of courseIds) {
            const enrollmentRef = doc(db, ENROLLMENT_COLLECTION, courseId);
            const docSnap = await getDoc(enrollmentRef);
            if (docSnap.exists()) {
                 if (!docSnap.data().studentIds.includes(studentId)) {
                    batch.update(enrollmentRef, { studentIds: arrayUnion(studentId) });
                 }
            } else {
                // If course enrollment doc doesn't exist, create it with the student.
                batch.set(enrollmentRef, { courseId, studentIds: [studentId] });
            }
        }

        await batch.commit();

    } catch (error) {
        console.error("Error updating student's course enrollments: ", error);
        throw new Error("Failed to update student's course enrollments.");
    }
}


/**
 * Gets the enrollment data for a specific course.
 * @param courseId - The ID of the course.
 * @returns The enrollment data, or null if not found.
 */
export const getEnrollmentForCourse = async (courseId: string): Promise<Enrollment | null> => {
    try {
        const docRef = doc(db, ENROLLMENT_COLLECTION, courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Enrollment;
        }
        return null;
    } catch (error) {
        console.error("Error fetching enrollment data: ", error);
        throw new Error("Failed to fetch enrollment data.");
    }
}

/**
 * Gets all course enrollments for a specific student.
 * @param studentId - The ID of the student.
 * @returns An array of course IDs the student is enrolled in.
 */
export const getCoursesForStudent = async (studentId: string): Promise<string[]> => {
    try {
        const enrollmentsRef = collection(db, ENROLLMENT_COLLECTION);
        const q = query(enrollmentsRef, where("studentIds", "array-contains", studentId));
        const querySnapshot = await getDocs(q);
        const courseIds: string[] = [];
        querySnapshot.forEach((doc) => {
            courseIds.push(doc.id);
        });
        return courseIds;
    } catch (error) {
        console.error("Error fetching courses for student: ", error);
        throw new Error("Failed to fetch courses for student.");
    }
}
