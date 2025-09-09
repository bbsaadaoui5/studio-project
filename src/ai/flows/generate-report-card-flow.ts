
'use server';
/**
 * @fileOverview An AI flow for generating student report card summaries and comments.
 *
 * - generateReportCard - A function that handles the report card generation process.
 * - GenerateReportCardInput - The input type for the generateReportCard function.
 * - GenerateReportCardOutput - The return type for the generateReportCard function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const CoursePerformanceSchema = z.object({
  courseName: z.string().describe('The name of the course.'),
  teacherName: z.string().describe('The name of the teacher for the course.'),
  finalGrade: z.string().describe('The final grade or percentage for the course.'),
});

export const GenerateReportCardInputSchema = z.object({
  studentName: z.string().describe("The student's full name."),
  className: z.string().describe("The student's class or grade level."),
  reportingPeriod: z.string().describe('The academic period for the report, e.g., "Fall Semester 2024".'),
  courses: z.array(CoursePerformanceSchema).describe("An array of the student's courses and their performance."),
});
export type GenerateReportCardInput = z.infer<typeof GenerateReportCardInputSchema>;

const ReportCardCourseResultSchema = z.object({
    courseName: z.string().describe("The name of the course."),
    teacherName: z.string().describe("The name of the teacher."),
    finalGrade: z.string().describe("The final grade for the course."),
    comments: z.string().describe("A 1-2 sentence, constructive, and encouraging comment about the student's performance in this specific course. Mention a strength and a potential area for growth."),
});

const GenerateReportCardOutputSchema = z.object({
  overallSummary: z.string().describe("A 2-3 sentence overall summary of the student's performance across all subjects for the reporting period. It should be positive and encouraging, highlighting general trends or achievements."),
  courses: z.array(ReportCardCourseResultSchema),
});
export type GenerateReportCardOutput = z.infer<typeof GenerateReportCardOutputSchema>;

export async function generateReportCard(input: GenerateReportCardInput): Promise<GenerateReportCardOutput> {
  return generateReportCardFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportCardPrompt',
  input: { schema: GenerateReportCardInputSchema },
  output: { schema: GenerateReportCardOutputSchema },
  prompt: `You are a helpful and experienced educator tasked with writing a student report card.
Your tone should be professional, encouraging, and constructive.

Based on the data provided, please generate:
1.  A brief, encouraging overall summary of the student's performance.
2.  A specific, constructive comment for each course listed. Each comment should mention one strength and one area for potential growth.

Student Name: {{{studentName}}}
Class: {{{className}}}
Reporting Period: {{{reportingPeriod}}}

Course Performances:
{{#each courses}}
- Course: {{courseName}}
  - Teacher: {{teacherName}}
  - Final Grade: {{finalGrade}}
{{/each}}

Please generate the full JSON output based on the provided schema.`,
});

const generateReportCardFlow = ai.defineFlow(
  {
    name: 'generateReportCardFlow',
    inputSchema: GenerateReportCardInputSchema,
    outputSchema: GenerateReportCardOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
