import Link from "next/link";
import type { ReactNode } from "react";
import { getStaffMember } from "@/services/staffService";

const nav = [
  { label: "لوحة التحكم", href: "dashboard" },
  { label: "الطلاب", href: "students" },
  { label: "الواجبات", href: "assignments" },
  { label: "الدرجات", href: "grades" },
  { label: "المحتوى التعليمي", href: "resources" },
  { label: "الجدول الدراسي", href: "timetable" },
  { label: "المراسلات", href: "communication" },
  { label: "الإعلانات", href: "announcements" },
  { label: "التقارير", href: "reports" },
  { label: "الإعدادات", href: "settings" },
];

export default async function TeacherPortalLayout({ children, params }: { children: ReactNode; params: any }) {
  // Accept either `teacherId` or `teacherid` to be robust across route param naming
  // Fallback to the 'me' alias so the layout remains usable if params is missing.
  // `params` can be a Promise in some Next.js dynamic APIs; await it before use
  const awaitedParams = await params;
  const teacherId = (awaitedParams && (awaitedParams.teacherId ?? awaitedParams.teacherid)) ?? 'me';
  let teacherName = 'بوابة الأستاذ';
  try {
    if (teacherId) {
      const staff = await getStaffMember(teacherId);
      if (staff && staff.name) teacherName = staff.name;
    }
  } catch (e) {
    // swallow server-side fetch errors but keep portal usable
    // eslint-disable-next-line no-console
    console.error('Failed to load teacher record for', teacherId, e);
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-l p-6 text-right">
        <div className="font-bold text-xl mb-1 text-center">{teacherName}</div>
        <div className="text-sm text-muted-foreground mb-6 text-center">بوابة الأستاذ</div>
        <nav>
          <ul className="space-y-4">
            {nav.map(item => (
              <li key={item.href}>
                <Link href={`/teacher/portal/${teacherId}/${item.href}`} className="block hover:text-blue-600">{item.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
