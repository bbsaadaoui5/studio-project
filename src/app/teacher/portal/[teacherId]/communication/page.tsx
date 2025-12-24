"use client";
import { useState } from "react";

// بيانات تجريبية للرسائل (يجب ربطها بقاعدة البيانات لاحقاً)
const demoMessages = [
  { id: 1, sender: "ولي أمر سارة", content: "هل يمكنني معرفة مستوى ابنتي؟", date: "2025-10-10" },
  { id: 2, sender: "محمد علي", content: "متى موعد الاختبار القادم؟", date: "2025-10-09" },
];

export default function TeacherCommunicationPage() {
  const [messages, setMessages] = useState(demoMessages);
  const [newMsg, setNewMsg] = useState({ content: "", recipient: "" });

  const sendMessage = () => {
    if (!newMsg.content.trim() || !newMsg.recipient.trim()) return;
    setMessages([
      ...messages,
      { id: messages.length + 1, sender: "الأستاذ", content: newMsg.content, date: new Date().toISOString().slice(0, 10) },
    ]);
    setNewMsg({ content: "", recipient: "" });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-right">💬 التواصل مع الطلاب وأولياء الأمور</h2>
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="font-bold mb-2">إرسال رسالة جديدة</h3>
        <div className="flex flex-col md:flex-row gap-2 items-center">
          <label htmlFor="comm-recipient" className="sr-only">المستلم</label>
          <input
            id="comm-recipient"
            name="recipient"
            type="text"
            placeholder="المستلم (اسم الطالب أو ولي الأمر)"
            value={newMsg.recipient}
            onChange={e => setNewMsg({ ...newMsg, recipient: e.target.value })}
            className="border rounded px-2 py-1"
            autoComplete="name"
          />
          <label htmlFor="comm-content" className="sr-only">محتوى الرسالة</label>
          <input
            id="comm-content"
            name="content"
            type="text"
            placeholder="محتوى الرسالة"
            value={newMsg.content}
            onChange={e => setNewMsg({ ...newMsg, content: e.target.value })}
            className="border rounded px-2 py-1 w-64"
            aria-label="محتوى الرسالة"
          />
          <button type="button" onClick={sendMessage} className="bg-blue-600 text-white rounded px-4 py-2">إرسال</button>
        </div>
      </div>
      <table className="w-full bg-white rounded shadow text-right">
        <thead>
          <tr>
            <th className="p-2">#</th>
            <th className="p-2">المرسل</th>
            <th className="p-2">المحتوى</th>
            <th className="p-2">التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg, idx) => (
            <tr key={msg.id}>
              <td className="p-2">{idx + 1}</td>
              <td className="p-2 font-semibold">{msg.sender}</td>
              <td className="p-2">{msg.content}</td>
              <td className="p-2">{msg.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}