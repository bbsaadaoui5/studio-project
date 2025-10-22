import { getStaffMembers } from "@/services/staffService";
import { slugifyName } from "@/components/teacher/slugify";

// Find teacher by slug
export async function getTeacherBySlug(slug: string) {
  const staffList = await getStaffMembers();
  return staffList.find(staff => slugifyName(staff.name) === slug) || null;
}
