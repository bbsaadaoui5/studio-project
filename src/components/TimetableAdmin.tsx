"use client"
import React, { useEffect, useState } from 'react'

import type { TimetableEntry } from '@/lib/types'

export default function TimetableAdmin({ initial = [] as TimetableEntry[] }: { initial?: TimetableEntry[] }) {
  const [entries, setEntries] = useState<TimetableEntry[]>(initial)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setEntries(initial)
  }, [initial])

  async function reload() {
    setLoading(true)
  const res = await fetch('/api/timetable')
  const data: TimetableEntry[] = await res.json()
    setEntries(data)
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    const payload = Object.fromEntries(fd) as any
    // normalize payload to TimetableEntry shape expected by backend
    // expect grade and className optionally provided; keep minimal required fields
    const body: Partial<TimetableEntry> = {
      grade: payload.grade || '9',
      className: payload.className || 'A',
      day: payload.day as TimetableEntry['day'] || 'Monday',
      timeSlot: payload.timeSlot || `${payload.start || '09:00'} - ${payload.end || '10:00'}`,
      courseId: payload.courseId || `c-${Date.now()}`,
      courseName: payload.subject || payload.courseName || 'General',
      teacherName: payload.teacherName || payload.teacherId || 'TBA',
      notes: payload.notes,
    }
    const res = await fetch('/api/timetable', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
    const created: TimetableEntry = await res.json()
    setEntries(prev => [created, ...prev])
    form.reset()
  }

  async function handleDelete(id?: string) {
    if (!id) return
    await fetch(`/api/timetable?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(x => x.id !== id))
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">الجدول الدراسي (لوحة الإدارة)</h2>
        <div>
          <button onClick={reload} className="btn">{loading ? 'جارٍ...' : 'تحديث'}</button>
        </div>
      </div>

      <form onSubmit={handleAdd} className="grid grid-cols-6 gap-2 mb-4">
        <input name="teacherId" placeholder="معرف المدرس" className="col-span-1 p-2 border" />
        <input name="teacherName" placeholder="اسم المدرس" className="col-span-1 p-2 border" />
        <select name="day" defaultValue="monday" className="col-span-1 p-2 border">
          <option value="monday">الاثنين</option>
          <option value="tuesday">الثلاثاء</option>
          <option value="wednesday">الأربعاء</option>
          <option value="thursday">الخميس</option>
          <option value="friday">الجمعة</option>
        </select>
        <input name="start" placeholder="09:00" className="col-span-1 p-2 border" />
        <input name="end" placeholder="10:00" className="col-span-1 p-2 border" />
        <input name="subject" placeholder="المادة" className="col-span-1 p-2 border" />
        <input name="room" placeholder="القاعة" className="col-span-1 p-2 border" />
        <div className="col-span-6 text-left">
          <button type="submit" className="btn-primary px-3 py-1">أضف حصة</button>
        </div>
      </form>

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id ?? JSON.stringify(e)} className="p-3 border rounded flex justify-between items-center">
            <div className="text-sm">
              <div className="font-semibold">{e.teacherName} — {e.courseName}</div>
              <div className="text-xs text-muted-foreground">Grade {e.grade} • Class {e.className} • {e.day} • {e.timeSlot}</div>
            </div>
            <div className="space-x-2">
              <button onClick={() => handleDelete(e.id)} className="text-sm text-red-600">حذف</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
