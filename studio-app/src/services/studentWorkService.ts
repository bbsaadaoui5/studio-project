import { db } from "@/lib/firebase-client";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { getAssignmentsForCourse } from "./gradeService";
import { getExams } from "./examService";
import { getCoursesByGrade } from "./courseService";
import type { Assignment, Exam } from "@/lib/types";

export interface StudentAssignment extends Assignment {
  status: "pending" | "submitted" | "graded";
  submissionDate?: string;
  grade?: number;
  courseName: string;
  courseId: string;
}

export interface StudentExam extends Exam {
  submitted: boolean;
  score?: number;
  courseName: string;
}

/**
 * احصل على جميع الواجبات المعلقة للطالب (لم تُسلّم بعد)
 */
export const getPendingAssignmentsForStudent = async (
  studentId: string,
  studentGrade: string,
  studentClassName: string
): Promise<StudentAssignment[]> => {
  try {
    if (!db) return [];

    const courses = await getCoursesByGrade(studentGrade);
    const allAssignments: StudentAssignment[] = [];

    // جلب الواجبات من جميع مواد الطالب
    for (const course of courses) {
      const assignments = await getAssignmentsForCourse(course.id);

      // تصفية الواجبات المعلقة (بدون تاريخ استحقاق في الماضي أو معلقة حالياً)
      const pending = assignments
        .filter((a) => {
          if (!a.dueDate) return true;
          const dueDate = new Date(a.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return dueDate >= today;
        })
        .map((a) => ({
          ...a,
          status: "pending" as const,
          courseName: course.name,
          courseId: course.id,
        }));

      allAssignments.push(...pending);
    }

    // ترتيب حسب تاريخ الاستحقاق
    return allAssignments.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return (
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
    });
  } catch (error) {
    console.error("Error fetching pending assignments:", error);
    return [];
  }
};

/**
 * احصل على الاختبارات القادمة للطالب
 */
export const getUpcomingExamsForStudent = async (
  studentId: string,
  studentGrade: string,
  studentClassName: string
): Promise<StudentExam[]> => {
  try {
    if (!db) return [];

    const courses = await getCoursesByGrade(studentGrade);
    const allExams = await getExams();

    const now = new Date();
    const upcomingExams: StudentExam[] = [];

    // تصفية الاختبارات التي تخص طالب في الصف والفصل الصحيح
    for (const exam of allExams) {
      const examDate = new Date(exam.examDate);

      // التحقق من أن الاختبار قادم (لم يمض)
      if (examDate < now) continue;

      // التحقق من أن الاختبار يخص الفصل الصحيح
      if (
        exam.classes &&
        !exam.classes.includes(studentClassName)
      ) {
        continue;
      }

      // البحث عن المادة المقابلة
      const course = courses.find((c) => c.id === exam.courseId);
      if (!course) continue;

      upcomingExams.push({
        ...exam,
        submitted: false,
        courseName: exam.courseName || course.name,
      });
    }

    // ترتيب حسب التاريخ
    return upcomingExams.sort(
      (a, b) =>
        new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
    );
  } catch (error) {
    console.error("Error fetching upcoming exams:", error);
    return [];
  }
};

/**
 * احصل على عدد الواجبات المعلقة
 */
export const getPendingAssignmentCount = async (
  studentId: string,
  studentGrade: string,
  studentClassName: string
): Promise<number> => {
  try {
    const pending = await getPendingAssignmentsForStudent(
      studentId,
      studentGrade,
      studentClassName
    );
    return pending.length;
  } catch (error) {
    console.error("Error counting pending assignments:", error);
    return 0;
  }
};

/**
 * احصل على الواجبات والاختبارات القادمة معاً
 */
export const getUpcomingWorkForStudent = async (
  studentId: string,
  studentGrade: string,
  studentClassName: string
): Promise<{
  assignments: StudentAssignment[];
  exams: StudentExam[];
  totalPending: number;
}> => {
  try {
    const assignments = await getPendingAssignmentsForStudent(
      studentId,
      studentGrade,
      studentClassName
    );
    const exams = await getUpcomingExamsForStudent(
      studentId,
      studentGrade,
      studentClassName
    );

    return {
      assignments,
      exams,
      totalPending: assignments.length,
    };
  } catch (error) {
    console.error("Error fetching upcoming work:", error);
    return {
      assignments: [],
      exams: [],
      totalPending: 0,
    };
  }
}
