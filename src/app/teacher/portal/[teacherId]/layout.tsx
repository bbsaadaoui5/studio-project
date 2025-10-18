"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

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

export default function TeacherPortalLayout({ children }: { children: ReactNode }) {
  const params = useParams();
  const teacherId = params?.teacherId;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-l p-6 text-right">
        <div className="font-bold text-xl mb-8 text-center">بوابة الأستاذ</div>
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
