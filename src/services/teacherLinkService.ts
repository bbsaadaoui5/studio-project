import { getStaffMember } from "@/services/staffService";
import { slugifyName } from "@/components/teacher/slugify";

// Generate a unique teacher portal link by id or slug
export async function getTeacherPortalLink(teacherId: string): Promise<string | null> {
  const staff = await getStaffMember(teacherId);
  if (!staff) return null;
  const slug = slugifyName(staff.name);
  // You can use either the id or the slug in the URL
  // return `/teacher/portal/${teacherId}`;
  return `/teacher/portal/${slug}`;
}
