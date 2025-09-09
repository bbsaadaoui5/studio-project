
"use server";

import { getStudent } from './studentService';
import { getCoursesForStudent } from './enrollmentService';
import { getCourse } from './courseService';
import { getAssignmentsForCourse, getGrades } from './gradeService';
import type { ReportCard, ReportCardCourse } from '@/lib/types';
import { generateReportCard as generateReportCardFlow, type GenerateReportCardInput } from '@/ai/flows/generate-report-card-flow';

/**
 * Compiles all necessary data and generates a report card for a student.
 * @param studentId - The ID of the student.
 * @param reportingPeriod - The period the report card is for (e.g., "Fall Semester 2024").
 * @returns A promise that resolves to the generated ReportCard object.
 */
export async function generateReportCard(studentId: string, reportingPeriod: string): Promise<ReportCard> {
  // 1. Fetch student details
  const student = await getStudent(studentId);
  if (!student) {
    throw new Error("Student not found.");
  }
  const studentClass = `Grade ${student.grade} - ${student.className}`;

  // 2. Fetch enrolled course IDs
  const courseIds = await getCoursesForStudent(studentId);
  if (courseIds.length === 0) {
     return {
      studentId: student.id,
      studentName: student.name,
      class: studentClass,
      reportingPeriod,
      overallSummary: "No courses enrolled for this period.",
      courses: [],
    };
  }

  // 3. Fetch details and grades for each course
  const coursesDataPromises = courseIds.map(async (courseId) => {
    const course = await getCourse(courseId);
    if (!course) return null;

    const assignments = await getAssignmentsForCourse(courseId);
    let totalScore = 0;
    let totalPoints = 0;

    for (const assignment of assignments) {
      const gradeData = await getGrades(assignment.id);
      // If gradeData exists and has the student's grade, process it
      if (gradeData && gradeData.studentGrades && gradeData.studentGrades[studentId]) {
        const studentGrade = gradeData.studentGrades[studentId];
        if (studentGrade && typeof studentGrade.score === 'number') {
            totalScore += studentGrade.score;
            totalPoints += assignment.totalPoints;
        }
      }
    }

    // Only include courses that have at least one graded assignment
    if (totalPoints === 0) {
        return null;
    }

    const finalGrade = ((totalScore / totalPoints) * 100).toFixed(1) + '%';
    
    return {
      courseName: course.name,
      teacherName: course.teacher,
      finalGrade,
    };
  });

  const resolvedCoursesData = (await Promise.all(coursesDataPromises)).filter(c => c !== null);

  // If after filtering, no courses have grades, return a specific message.
  if (resolvedCoursesData.length === 0) {
    return {
      studentId: student.id,
      studentName: student.name,
      class: studentClass,
      reportingPeriod,
      overallSummary: "The student has no graded assignments in any courses for this period.",
      courses: [],
    };
  }

  // 4. Use Genkit to generate comments and summary
  const flowInput: GenerateReportCardInput = {
    studentName: student.name,
    className: studentClass,
    reportingPeriod: reportingPeriod,
    courses: resolvedCoursesData.map(c => ({
        courseName: c!.courseName,
        teacherName: c!.teacherName,
        finalGrade: c!.finalGrade,
    }))
  };
  
  const aiGeneratedOutput = await generateReportCardFlow(flowInput);

  // 5. Combine data into final ReportCard object
  return {
    studentId,
    studentName: student.name,
    class: studentClass,
    reportingPeriod,
    overallSummary: aiGeneratedOutput.overallSummary,
    courses: aiGeneratedOutput.courses.map(courseSummary => ({
        ...courseSummary,
    })),
  };
}
