"use client";
import { useState } from "react";

// بيانات تجريبية للدرجات (يجب ربطها بقاعدة البيانات لاحقاً)
const demoGrades = [
  { id: 1, name: "محمد علي", grade: "الثالثة إعدادي", score: 15 },
  { id: 2, name: "سارة أحمد", grade: "الثالثة إعدادي", score: 18 },
  { id: 3, name: "يوسف سعيد", grade: "الثالثة إعدادي", score: 12 },
];

export default function TeacherGradesPage() {
  const [grades, setGrades] = useState(demoGrades);

  // تحديث الدرجات
  const updateScore = (id: number, score: number) => {
    setGrades(grades => grades.map(s => s.id === id ? { ...s, score } : s));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">📝 درجات الطلاب</h2>
      <table className="w-full bg-white rounded shadow text-right">
        <thead>
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">اسم الطالب</th>
            <th className="p-2">الصف</th>
            <th className="p-2">الدرجة</th>
          </tr>
        </thead>
        <tbody>
          {grades.map((student, idx) => (
            <tr key={student.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2 font-semibold">{student.name}</td>
              <td className="p-2">{student.grade}</td>
              <td className="p-2">
                <label htmlFor={`score-${student.id}`} className="sr-only">درجة {student.name}</label>
                <input
                  id={`score-${student.id}`}
                  name={`score-${student.id}`}
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
