import React from "react";
import Link from "next/link";

const navItems = [
  { label: "الرئيسية", href: "/teacher/portal/me" },
  { label: "جدولي", href: "/teacher/portal/me#timetable" },
  { label: "دوراتي", href: "/teacher/portal/me#courses" },
  { label: "الإعلانات", href: "/teacher/portal/me#announcements" },
  // أضف المزيد حسب الحاجة
];

export default function TeacherSidebar({ teacherSlug }: { teacherSlug: string }) {
  return (
    <aside className="teacher-sidebar w-64 bg-white border-r min-h-screen p-6">
      <div className="font-bold text-xl mb-8 text-center">بوابة الأستاذ</div>
      <nav>
        <ul className="space-y-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href.replace('me', teacherSlug)} className="block hover:text-blue-600">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
