export type GenerateLessonPlanOutput = {
  title: string;
  objectives: string[];
  materials: string[];
  activities: string[];
};

// Lightweight stub used when the AI flow is not available during type-check/build.
// Replace with the real implementation when the AI flow is added.
export async function generateLessonPlan(_opts: any): Promise<GenerateLessonPlanOutput> {
  return {
    title: "Generated Lesson Plan",
    objectives: ["Objective 1", "Objective 2"],
    materials: ["Material A", "Material B"],
    activities: ["Activity 1", "Activity 2"],
  };
}
