'use server';
/**
 * @fileOverview A flow for generating school announcements.
 *
 * - generateAnnouncement - A function that handles the announcement generation process.
 * - GenerateAnnouncementInput - The input type for the generateAnnouncement function.
 * - GenerateAnnouncementOutput - The return type for the generateAnnouncement function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateAnnouncementInputSchema = z.object({
  topic: z.string().describe('The topic of the announcement.'),
});
export type GenerateAnnouncementInput = z.infer<typeof GenerateAnnouncementInputSchema>;

const GenerateAnnouncementOutputSchema = z.object({
  title: z.string().describe('The generated title for the announcement.'),
  content: z.string().describe('The generated content for the announcement.'),
});
export type GenerateAnnouncementOutput = z.infer<typeof GenerateAnnouncementOutputSchema>;

export async function generateAnnouncement(input: GenerateAnnouncementInput): Promise<GenerateAnnouncementOutput> {
  return generateAnnouncementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAnnouncementPrompt',
  input: { schema: GenerateAnnouncementInputSchema },
  output: { schema: GenerateAnnouncementOutputSchema },
  prompt: `You are an expert school administrator, skilled at writing clear, friendly, and professional announcements.

Generate a school announcement based on the following topic. The announcement should have a clear title and engaging content.

Topic: {{{topic}}}`,
});

const generateAnnouncementFlow = ai.defineFlow(
  {
    name: 'generateAnnouncementFlow',
    inputSchema: GenerateAnnouncementInputSchema,
    outputSchema: GenerateAnnouncementOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
