import Link from "next/link";

export default function TeacherDashboardPage({ params }: any) {
  // Accept either teacherId or teacherid to be robust across param naming
  const teacherId = params?.teacherId ?? params?.teacherid ?? 'me';
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6 text-right">👋 مرحباً أستاذ/ة</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* إحصائيات سريعة */}
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl mb-2">👥</div>
          <div className="text-lg font-semibold">عدد الطلاب</div>
          <div className="text-2xl text-blue-600 font-bold">32</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl mb-2">📚</div>
          <div className="text-lg font-semibold">عدد المواد</div>
          <div className="text-2xl text-blue-600 font-bold">5</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-4xl mb-2">📝</div>
          <div className="text-lg font-semibold">متوسط الدرجات</div>
          <div className="text-2xl text-blue-600 font-bold">87%</div>
        </div>
      </div>


      {/* الجدول اليومي والمهام */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-right">🗓️ جدول اليوم</h2>
          <ul className="space-y-2 text-right">
            <li>08:00 - 09:00: رياضيات (الثالثة إعدادي)</li>
            <li>09:15 - 10:15: علوم (الثانية إعدادي)</li>
            <li>10:30 - 11:30: لغة عربية (الأولى إعدادي)</li>
          </ul>
          <div className="mt-4 text-left">
            <Link href={`/teacher/portal/${teacherId}/timetable`} className="text-blue-600 underline">تعديل الجدول &rarr;</Link>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-right">📋 المهام القادمة</h2>
          <ul className="space-y-2 text-right">
            <li>تصحيح واجب الرياضيات - الصف الثالثة</li>
            <li>إعداد اختبار العلوم - الصف الثانية</li>
            <li>إرسال تقرير الحضور لأولياء الأمور</li>
          </ul>
        </div>
      </div>

      {/* آخر الرسائل */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-bold mb-4 text-right">💬 آخر الرسائل</h2>
        <ul className="space-y-2 text-right">
          <li>
            <span className="font-semibold">ولي أمر:</span> شكراً على المتابعة المستمرة.
            <span className="text-xs text-gray-500 ml-2">اليوم</span>
          </li>
          <li>
            <span className="font-semibold">إدارة المدرسة:</span> اجتماع المعلمين غداً الساعة 12.
            <span className="text-xs text-gray-500 ml-2">أمس</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
