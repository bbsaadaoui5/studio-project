"use client";
import { useState } from "react";
import { ActionIcons } from "@/components/action-icons";

// بيانات تجريبية للموارد (يجب ربطها بقاعدة البيانات لاحقاً)
const demoResources = [
  { id: 1, title: "ملخص رياضيات - الفصل الأول", type: "PDF", link: "#" },
  { id: 2, title: "عرض بوربوينت: الطاقة المتجددة", type: "PowerPoint", link: "#" },
  { id: 3, title: "ورقة عمل علوم", type: "Word", link: "#" },
];

export default function TeacherResourcesPage() {
  const [resources, setResources] = useState(demoResources);
  const [newResource, setNewResource] = useState({ title: "", type: "PDF", link: "" });

  const addResource = () => {
    if (!newResource.title.trim() || !newResource.link.trim()) return;
    setResources([
      ...resources,
      { ...newResource, id: resources.length + 1 },
    ]);
    setNewResource({ title: "", type: "PDF", link: "" });
  };

  const removeResource = (id: number) => {
    setResources(resources.filter(r => r.id !== id));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">📚 موارد الأستاذ</h2>
      <table className="w-full bg-white rounded shadow text-right mb-6">
        <thead>
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">العنوان</th>
            <th className="p-2">النوع</th>
            <th className="p-2">رابط</th>
            <th className="p-2">إجراء</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((res, idx) => (
            <tr key={res.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2 font-semibold">{res.title}</td>
              <td className="p-2">{res.type}</td>
              <td className="p-2">
                <a href={res.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">فتح</a>
              </td>
              <td className="p-2">
                <ActionIcons
                  onDelete={() => removeResource(res.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="font-bold mb-2">إضافة مورد جديد</h3>
          <div className="flex flex-col md:flex-row gap-2 items-center">
          <label htmlFor="resource-title" className="sr-only">العنوان</label>
          <input
            id="resource-title"
            name="title"
            type="text"
            placeholder="العنوان"
            value={newResource.title}
            onChange={e => setNewResource({ ...newResource, title: e.target.value })}
            className="border rounded px-2 py-1"
            autoComplete="off"
          />
          <select value={newResource.type} onChange={e => setNewResource({ ...newResource, type: e.target.value })} className="border rounded px-2 py-1">
            <option value="PDF">PDF</option>
            <option value="Word">Word</option>
            <option value="PowerPoint">PowerPoint</option>
            <option value="Link">رابط خارجي</option>
          </select>
          <label htmlFor="resource-link" className="sr-only">رابط الملف</label>
          <input
            id="resource-link"
            name="link"
            type="text"
            placeholder="رابط الملف أو المورد"
            value={newResource.link}
            onChange={e => setNewResource({ ...newResource, link: e.target.value })}
            className="border rounded px-2 py-1"
            autoComplete="url"
          />
          <button type="button" onClick={addResource} className="bg-blue-600 text-white rounded px-4 py-2">إضافة</button>
        </div>
      </div>
    </div>
  );
}