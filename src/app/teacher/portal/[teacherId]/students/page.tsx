"use client";
import { useState } from "react";

// بيانات تجريبية (يجب ربطها بقاعدة البيانات لاحقاً)
const demoStudents = [
  { id: 1, name: "محمد علي", grade: "الثالثة إعدادي", present: true, score: 15 },
  { id: 2, name: "سارة أحمد", grade: "الثالثة إعدادي", present: false, score: 18 },
  { id: 3, name: "يوسف سعيد", grade: "الثالثة إعدادي", present: true, score: 12 },
];

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState(demoStudents);

  // تحديث الحضور
  const toggleAttendance = (id: number) => {
    setStudents(students => students.map(s => s.id === id ? { ...s, present: !s.present } : s));
  };

  // تحديث الدرجات
  const updateScore = (id: number, score: number) => {
    setStudents(students => students.map(s => s.id === id ? { ...s, score } : s));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">👥 طلاب الأستاذ</h2>
      <table className="w-full bg-white rounded shadow text-right">
        <thead>
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">اسم الطالب</th>
            <th className="p-2">الصف</th>
            <th className="p-2">الحضور اليوم</th>
            <th className="p-2">الدرجة</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student, idx) => (
            <tr key={student.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2 font-semibold">{student.name}</td>
              <td className="p-2">{student.grade}</td>
              <td className="p-2">
                <input
                  type="checkbox"
                  checked={student.present}
                  onChange={() => toggleAttendance(student.id)}
                  className="w-5 h-5"
                />
                <span className={student.present ? "text-green-600 ml-2" : "text-red-600 ml-2"}>
                  {student.present ? "حاضر" : "غائب"}
                </span>
              </td>
              <td className="p-2">
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={student.score}
                  onChange={e => updateScore(student.id, Number(e.target.value))}
                  className="border rounded px-2 py-1 w-20 text-center"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
