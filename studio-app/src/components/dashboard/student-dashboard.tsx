import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
  {/* Page-level heading for accessibility (screen-reader only) */}
  <h1 className="sr-only">لوحة طالب</h1>
  {/* Hidden H2 to satisfy heading order checks when card titles are H3s */}
  <h2 className="sr-only">نظرة عامة</h2>
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">القائمة الرئيسية</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-right">
                <li>
                  <a href="#courses" className="text-gray-900 hover:underline">الدروس/المواد</a>
                </li>
                <li>
                  <a href="#grades" className="text-gray-900 hover:underline">الدرجات</a>
                </li>
                <li>
                  <a href="#attendance" className="text-gray-900 hover:underline">الحضور</a>
                </li>
                <li>
                  <a href="#notifications" className="text-gray-900 hover:underline">التنبيهات</a>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Courses Section */}
          <Card id="courses">
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">الدروس/المواد</h2>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">هنا يمكنك استعراض المواد والدروس المسجلة لك.</div>
              {/* مثال: جدول المواد */}
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">المادة</th>
                      <th className="p-2 border">الأستاذ</th>
                      <th className="p-2 border">عدد الحصص</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border">الرياضيات</td>
                      <td className="p-2 border">أ. محمد</td>
                      <td className="p-2 border">4</td>
                    </tr>
                    <tr>
                      <td className="p-2 border">اللغة العربية</td>
                      <td className="p-2 border">أ. فاطمة</td>
                      <td className="p-2 border">3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* Grades Section */}
          <Card id="grades">
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">الدرجات</h2>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">هنا يمكنك استعراض درجاتك في المواد المختلفة.</div>
              {/* مثال: جدول الدرجات */}
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">المادة</th>
                      <th className="p-2 border">الدرجة</th>
                      <th className="p-2 border">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border">الرياضيات</td>
                      <td className="p-2 border">18.0</td>
                      <td className="p-2 border">ممتاز</td>
                    </tr>
                    <tr>
                      <td className="p-2 border">اللغة العربية</td>
                      <td className="p-2 border">15.5</td>
                      <td className="p-2 border">جيد جدًا</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* Attendance Section */}
          <Card id="attendance">
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">الحضور</h2>
            </CardHeader>
            <CardContent>
              <div className="text-gray-700">سجل الحضور الخاص بك.</div>
              {/* مثال: جدول الحضور */}
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border">التاريخ</th>
                      <th className="p-2 border">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border">2025-10-01</td>
                      {/* Use darker colors to meet WCAG contrast ratios on light background */}
                      <td className="p-2 border text-green-800">حاضر</td>
                    </tr>
                    <tr>
                      <td className="p-2 border">2025-10-02</td>
                      <td className="p-2 border text-red-700">غائب</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {/* Notifications Section */}
          <Card id="notifications">
            <CardHeader>
              <h2 className="text-2xl font-semibold leading-none tracking-tight">التنبيهات</h2>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pr-6 text-gray-700 space-y-2">
                <li>تم إضافة درجة جديدة في مادة الرياضيات.</li>
                <li>يرجى مراجعة جدول الحصص الجديد.</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
