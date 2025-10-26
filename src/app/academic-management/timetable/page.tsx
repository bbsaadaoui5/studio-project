import React from 'react'
import { getWeeklyTimetable } from '@/services/timetableService'
import TimetableAdmin from '@/components/TimetableAdmin'

export default async function TimetablePage() {
  const items = await getWeeklyTimetable()

  return (
    <div className="p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">الجدول الدراسي - الإدارة الأكاديمية</h1>
        <p className="text-sm text-muted-foreground">عرض ومتابعة جداول المدرسين لهذا الأسبوع. يمكن للإدارة إضافة أو تعديل أو حذف الحصص.</p>
      </header>

      <section className="mb-8">
        <TimetableAdmin initial={items} />
      </section>
    </div>
  )
}
