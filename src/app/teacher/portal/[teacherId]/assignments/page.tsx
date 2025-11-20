"use client";
import { useState } from "react";

// بيانات تجريبية للواجبات (يجب ربطها بقاعدة البيانات لاحقاً)
const demoAssignments = [
  { id: 1, title: "واجب رياضيات 1", due: "2025-10-15", status: "مفتوح" },
  { id: 2, title: "واجب علوم: الطاقة", due: "2025-10-18", status: "مفتوح" },
];

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState(demoAssignments);
  const [newAssignment, setNewAssignment] = useState({ title: "", due: "", status: "مفتوح" });

  const addAssignment = () => {
    if (!newAssignment.title.trim() || !newAssignment.due.trim()) return;
    setAssignments([
      ...assignments,
      { ...newAssignment, id: assignments.length + 1 },
    ]);
    setNewAssignment({ title: "", due: "", status: "مفتوح" });
  };

  const closeAssignment = (id: number) => {
    setAssignments(assignments.map(a => a.id === id ? { ...a, status: "مغلق" } : a));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">📄 إدارة الواجبات</h2>
      <table className="w-full bg-white rounded shadow text-right mb-6">
        <thead>
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">العنوان</th>
            <th className="p-2">آخر أجل</th>
            <th className="p-2">الحالة</th>
            <th className="p-2">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((a, idx) => (
            <tr key={a.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2 font-semibold">{a.title}</td>
              <td className="p-2">{a.due}</td>
              <td className="p-2">{a.status}</td>
              <td className="p-2">
                {a.status === "مفتوح" && (
                  <button type="button" onClick={() => closeAssignment(a.id)} className="text-red-600 underline">إغلاق</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-bold mb-2">نشر واجب جديد</h3>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <input
            type="text"
            placeholder="عنوان الواجب"
            value={newAssignment.title}
            onChange={e => setNewAssignment({ ...newAssignment, title: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            type="date"
            value={newAssignment.due}
            onChange={e => setNewAssignment({ ...newAssignment, due: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <button type="button" onClick={addAssignment} className="bg-blue-600 text-white rounded px-4 py-2">نشر</button>
        </div>
      </div>
    </div>
  );
}