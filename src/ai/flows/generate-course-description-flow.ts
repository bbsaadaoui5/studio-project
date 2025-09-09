'use server';
/**
 * @fileOverview A flow for generating course descriptions.
 *
 * - generateCourseDescription - A function that handles the course description generation process.
 * - GenerateCourseDescriptionInput - The input type for the generateCourseDescription function.
 * - GenerateCourseDescriptionOutput - The return type for the generateCourseDescription function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateCourseDescriptionInputSchema = z.object({
  name: z.string().describe('The name of the course.'),
  keywords: z.string().describe('A few keywords to guide the description, separated by commas.'),
});
export type GenerateCourseDescriptionInput = z.infer<typeof GenerateCourseDescriptionInputSchema>;

const GenerateCourseDescriptionOutputSchema = z.object({
  description: z.string().describe('The generated, concise, and engaging course description.'),
});
export type GenerateCourseDescriptionOutput = z.infer<typeof GenerateCourseDescriptionOutputSchema>;

export async function generateCourseDescription(input: GenerateCourseDescriptionInput): Promise<GenerateCourseDescriptionOutput> {
  return generateCourseDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCourseDescriptionPrompt',
  input: { schema: GenerateCourseDescriptionInputSchema },
  output: { schema: GenerateCourseDescriptionOutputSchema },
  prompt: `You are an expert curriculum designer. Your task is to write a compelling, one-paragraph course description.

The description should be engaging for students and parents, clearly outlining what the course covers.

Use the following information to generate the description.

Course Name: {{{name}}}
Keywords: {{{keywords}}}`,
});

const generateCourseDescriptionFlow = ai.defineFlow(
  {
    name: 'generateCourseDescriptionFlow',
    inputSchema: GenerateCourseDescriptionInputSchema,
    outputSchema: GenerateCourseDescriptionOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
