"use client";
import { useState } from "react";

const initialProfile = {
  name: "الأستاذ أحمد",
  email: "ahmed.teacher@email.com",
  phone: "0600000000",
  language: "العربية",
};

export default function TeacherSettingsPage() {
  const [profile, setProfile] = useState(initialProfile);
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const saveProfile = () => {
    setSaved(true);
    // هنا يمكن ربط الحفظ بقاعدة البيانات
  };

  return (
    <div className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-right">⚙️ إعدادات الحساب</h2>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col text-right">
          <span className="mb-1">الاسم</span>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-right">
          <span className="mb-1">البريد الإلكتروني</span>
          <input
            type="email"
            name="email"
            value={profile.email}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-right">
          <span className="mb-1">رقم الهاتف</span>
          <input
            type="text"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          />
        </label>
        <label className="flex flex-col text-right">
          <span className="mb-1">اللغة المفضلة</span>
          <select
            name="language"
            value={profile.language}
            onChange={handleChange}
            className="border rounded px-2 py-1"
          >
            <option value="العربية">العربية</option>
            <option value="الفرنسية">الفرنسية</option>
            <option value="الإنجليزية">الإنجليزية</option>
          </select>
        </label>
        <button
          type="button"
          onClick={saveProfile}
          aria-label="حفظ التغييرات"
          className="bg-blue-600 text-white rounded px-4 py-2 mt-4 self-end"
        >
          حفظ التغييرات
        </button>
        {saved && <div className="text-green-600 text-right mt-2">تم حفظ التغييرات بنجاح!</div>}
      </div>
    </div>
  );
}