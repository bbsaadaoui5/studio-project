"use client";
import { useState } from "react";

// بيانات تجريبية للإعلانات (يجب ربطها بقاعدة البيانات لاحقاً)
const demoAnnouncements = [
  { id: 1, title: "امتحان الرياضيات يوم الإثنين", date: "2025-10-12" },
  { id: 2, title: "زيارة تربوية للصف الثالثة", date: "2025-10-20" },
];

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState(demoAnnouncements);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: "", date: "" });

  const addAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.date.trim()) return;
    setAnnouncements([
      ...announcements,
      { ...newAnnouncement, id: announcements.length + 1 },
    ]);
    setNewAnnouncement({ title: "", date: "" });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">📢 الإعلانات المهمة</h2>
      <table className="w-full bg-white rounded shadow text-right mb-6">
        <thead>
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">العنوان</th>
            <th className="p-2">التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {announcements.map((a, idx) => (
            <tr key={a.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2 font-semibold">{a.title}</td>
              <td className="p-2">{a.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-bold mb-2">نشر إعلان جديد</h3>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <label htmlFor="announcement-title" className="sr-only">عنوان الإعلان</label>
          <input
            id="announcement-title"
            name="title"
            type="text"
            placeholder="عنوان الإعلان"
            value={newAnnouncement.title}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
            className="border rounded px-2 py-1"
            autoComplete="off"
          />
          <label htmlFor="announcement-date" className="sr-only">تاريخ الإعلان</label>
          <input
            id="announcement-date"
            name="date"
            type="date"
            value={newAnnouncement.date}
            onChange={e => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <button type="button" onClick={addAnnouncement} className="bg-blue-600 text-white rounded px-4 py-2">نشر</button>
        </div>
      </div>
    </div>
  );
}