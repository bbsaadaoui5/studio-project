import { getStudent } from './studentService';
import { getCourse } from './courseService';
import { getCoursesForStudent } from './enrollmentService';
import { ReportCard } from '@/lib/types';

/**
 * Compiles all necessary data and generates a report card for a student.
 * @param studentId - The ID of the student.
 * @param reportingPeriod - The period the report card is for (e.g., "Fall Semester 2024").
 * @returns A promise that resolves to the generated ReportCard object.
 */
export async function generateReportCard(studentId: string, reportingPeriod: string): Promise<ReportCard> {
  // Minimal mock implementation that composes a ReportCard using available services.
  const student = await getStudent(studentId);
  const courseIds = await getCoursesForStudent(studentId).catch(() => [] as string[]);

  const coursePromises = courseIds.map(async (id) => {
    const course = await getCourse(id);
    if (!course) return null;
    return {
      courseName: course.name,
      teacherName: course.teachers?.[0]?.name || 'TBA',
      finalGrade: 'N/A',
      comments: 'No comments available.'
    };
  });

  const courses = (await Promise.all(coursePromises)).filter(Boolean) as unknown as ReportCard['courses'];

  return {
    studentId,
    studentName: student?.name || 'Unknown Student',
    class: student ? `${student.grade} - ${student.className}` : 'Unknown',
    reportingPeriod,
    overallSummary: 'This is a mock report card. AI generation is disabled in this environment.',
    courses: courses || []
  };
}

