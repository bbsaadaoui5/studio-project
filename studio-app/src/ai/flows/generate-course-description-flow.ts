export type GenerateCourseDescriptionOutput = { description: string };

export async function generateCourseDescription(courseName: string): Promise<GenerateCourseDescriptionOutput> {
  // lightweight stub — replace with real AI integration when available
  return { description: `A practical course covering fundamentals and projects in ${courseName}.` };
}
