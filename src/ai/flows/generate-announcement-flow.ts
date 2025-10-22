export type GenerateAnnouncementOutput = {
  title: string;
  content: string;
};

export async function generateAnnouncement(prompt: string): Promise<GenerateAnnouncementOutput> {
  // Lightweight stub: return a safe default based on prompt
  return {
    title: `Generated: ${prompt.slice(0, 40)}`,
    content: `Auto-generated announcement based on: ${prompt}`,
  };
}

export default generateAnnouncement;
