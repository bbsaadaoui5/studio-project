"use client";
import { useState } from "react";

// بيانات تجريبية للتقارير (يجب ربطها بقاعدة البيانات لاحقاً)
const demoReports = [
  { id: 1, student: "محمد علي", type: "تقرير شهري", date: "2025-10-01", status: "تم الإرسال" },
  { id: 2, student: "سارة أحمد", type: "تقرير سلوك", date: "2025-09-28", status: "قيد الإعداد" },
];

export default function TeacherReportsPage() {
  const [reports, setReports] = useState(demoReports);
  const [newReport, setNewReport] = useState({ student: "", type: "تقرير شهري" });

  const addReport = () => {
    if (!newReport.student.trim()) return;
    setReports([
      ...reports,
      { id: reports.length + 1, student: newReport.student, type: newReport.type, date: new Date().toISOString().slice(0, 10), status: "قيد الإعداد" },
    ]);
    setNewReport({ student: "", type: "تقرير شهري" });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">📑 تقارير الطلاب</h2>
      <table className="w-full bg-white rounded shadow text-right mb-6">
        <thead>
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">اسم الطالب</th>
            <th className="p-2">نوع التقرير</th>
            <th className="p-2">التاريخ</th>
            <th className="p-2">الحالة</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((rep, idx) => (
            <tr key={rep.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2 font-semibold">{rep.student}</td>
              <td className="p-2">{rep.type}</td>
              <td className="p-2">{rep.date}</td>
              <td className="p-2">{rep.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-bold mb-2">إعداد تقرير جديد</h3>
          <div className="flex flex-col md:flex-row gap-2 items-center">
          <label htmlFor="report-student" className="sr-only">اسم الطالب</label>
          <input
            id="report-student"
            name="student"
            type="text"
            placeholder="اسم الطالب"
            value={newReport.student}
            onChange={e => setNewReport({ ...newReport, student: e.target.value })}
            className="border rounded px-2 py-1"
            autoComplete="name"
          />
          <select value={newReport.type} onChange={e => setNewReport({ ...newReport, type: e.target.value })} className="border rounded px-2 py-1">
            <option value="تقرير شهري">تقرير شهري</option>
            <option value="تقرير سلوك">تقرير سلوك</option>
            <option value="تقرير غياب">تقرير غياب</option>
          </select>
          <button type="button" onClick={addReport} className="bg-blue-600 text-white rounded px-4 py-2">إضافة</button>
        </div>
      </div>
    </div>
  );
}