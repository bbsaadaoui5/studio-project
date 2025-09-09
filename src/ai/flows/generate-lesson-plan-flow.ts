'use server';
/**
 * @fileOverview A flow for generating lesson plans.
 *
 * - generateLessonPlan - A function that handles the lesson plan generation process.
 * - GenerateLessonPlanInput - The input type for the generateLessonPlan function.
 * - GenerateLessonPlanOutput - The return type for the generateLessonPlan function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateLessonPlanInputSchema = z.object({
  topic: z.string().describe('The main topic or subject of the lesson.'),
  gradeLevel: z.string().describe('The grade level for which the lesson is intended (e.g., "Grade 5").'),
});
export type GenerateLessonPlanInput = z.infer<typeof GenerateLessonPlanInputSchema>;

const GenerateLessonPlanOutputSchema = z.object({
  title: z.string().describe('A creative and engaging title for the lesson plan.'),
  objectives: z.array(z.string()).describe('A list of 2-3 clear learning objectives for the lesson.'),
  materials: z.array(z.string()).describe('A list of necessary materials for the lesson.'),
  activities: z.array(z.string()).describe('A list of step-by-step activities to conduct during the lesson.'),
});
export type GenerateLessonPlanOutput = z.infer<typeof GenerateLessonPlanOutputSchema>;

export async function generateLessonPlan(input: GenerateLessonPlanInput): Promise<GenerateLessonPlanOutput> {
  return generateLessonPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateLessonPlanPrompt',
  input: { schema: GenerateLessonPlanInputSchema },
  output: { schema: GenerateLessonPlanOutputSchema },
  prompt: `You are an expert curriculum developer and instructional designer. Your task is to create a clear, engaging, and effective lesson plan.

Generate a complete lesson plan based on the provided topic and grade level. The plan should be structured with a title, clear objectives, a list of materials, and a sequence of activities.

Topic: {{{topic}}}
Grade Level: {{{gradeLevel}}}`,
});

const generateLessonPlanFlow = ai.defineFlow(
  {
    name: 'generateLessonPlanFlow',
    inputSchema: GenerateLessonPlanInputSchema,
    outputSchema: GenerateLessonPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
