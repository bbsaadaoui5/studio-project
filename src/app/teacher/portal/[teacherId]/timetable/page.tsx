"use client";
import { useState } from "react";

const days = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const slots = ["08:00-09:00", "09:15-10:15", "10:30-11:30", "13:00-14:00"]; // مثال

const initialTimetable = [
  { day: "الإثنين", slot: "08:00-09:00", subject: "رياضيات" },
  { day: "الإثنين", slot: "09:15-10:15", subject: "علوم" },
  { day: "الثلاثاء", slot: "08:00-09:00", subject: "لغة عربية" },
];

export default function TeacherTimetablePage() {
  const [timetable, setTimetable] = useState(initialTimetable);
  const [newEntry, setNewEntry] = useState({ day: days[0], slot: slots[0], subject: "" });

  const addEntry = () => {
    if (!newEntry.subject.trim()) return;
    setTimetable([...timetable, { ...newEntry }]);
    setNewEntry({ day: days[0], slot: slots[0], subject: "" });
  };

  const removeEntry = (idx: number) => {
    setTimetable(timetable.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">🗓️ الجدول الدراسي للأستاذ</h2>
      <table className="w-full bg-white rounded shadow text-right mb-6">
        <thead>
          <tr>
            <th className="p-2">اليوم</th>
            <th className="p-2">الحصة</th>
            <th className="p-2">المادة</th>
            <th className="p-2">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {timetable.map((entry, idx) => (
            <tr key={idx}>
              <td className="p-2">{entry.day}</td>
              <td className="p-2">{entry.slot}</td>
              <td className="p-2">{entry.subject}</td>
              <td className="p-2">
                <button type="button" onClick={() => removeEntry(idx)} className="text-red-600 underline">حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-bold mb-2">إضافة حصة جديدة</h3>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <select value={newEntry.day} onChange={e => setNewEntry({ ...newEntry, day: e.target.value })} className="border rounded px-2 py-1">
            {days.map(day => <option key={day} value={day}>{day}</option>)}
          </select>
          <select value={newEntry.slot} onChange={e => setNewEntry({ ...newEntry, slot: e.target.value })} className="border rounded px-2 py-1">
            {slots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
          </select>
          <input
            type="text"
            placeholder="المادة"
            value={newEntry.subject}
            onChange={e => setNewEntry({ ...newEntry, subject: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <button type="button" onClick={addEntry} className="bg-blue-600 text-white rounded px-4 py-2">إضافة</button>
        </div>
      </div>
    </div>
  );
}