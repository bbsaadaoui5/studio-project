"use client"
import React, { useState } from 'react'
import timetableService from '@/services/timetableService'
import type { TimetableEntry } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

export default function TimetableEditor({ grade, className, initial = [] as TimetableEntry[] }: { grade: string, className: string, initial?: TimetableEntry[] }) {
  const [entries, setEntries] = useState<TimetableEntry[]>(initial)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const fd = new FormData(form)
    const payload = Object.fromEntries(fd) as any

    const newEntry: Omit<TimetableEntry, 'id'> = {
  grade,
  className,
  day: payload.day || 'Monday',
  timeSlot: payload.timeSlot || '09:00 - 10:00',
  courseName: payload.courseName || payload.subject || 'عام',
  teacherName: payload.teacherName || 'TBA',
  notes: payload.notes || '',
    courseId: payload.courseId || payload.courseName || payload.subject || 'عام', 
};
      

    setSaving(true)
    try {
      const created = await timetableService.addTimetableEntry(newEntry)
      // ensure an id is present
      const stable = { id: created.id || `local-${Date.now()}`, ...created }
      setEntries(prev => [stable as TimetableEntry, ...prev])
      toast({ title: 'تمت الإضافة', description: 'تمت إضافة الحصة.' })
      form.reset()
    } catch (err: any) {
      console.error(err)
      toast({ title: 'خطأ', description: err?.message || 'فشل إضافة الحصة', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="grid grid-cols-6 gap-2 mb-4" aria-label="Add timetable entry">
        <label htmlFor="te-course" className="sr-only">المادة</label>
        <input id="te-course" name="courseName" placeholder="المادة" className="col-span-2 p-2 border" />

        <label htmlFor="te-teacher" className="sr-only">المدرس</label>
        <input id="te-teacher" name="teacherName" placeholder="اسم المدرس" className="col-span-2 p-2 border" />

        <label htmlFor="te-day" className="sr-only">اليوم</label>
        <select id="te-day" name="day" defaultValue="Monday" className="col-span-1 p-2 border">
          <option value="Monday">الاثنين</option>
          <option value="Tuesday">الثلاثاء</option>
          <option value="Wednesday">الأربعاء</option>
          <option value="Thursday">الخميس</option>
          <option value="Friday">الجمعة</option>
        </select>

        <label htmlFor="te-slot" className="sr-only">الفترة</label>
        <input id="te-slot" name="timeSlot" placeholder="09:00 - 10:00" className="col-span-1 p-2 border" />

        <div className="col-span-6 text-left">
          <button type="submit" disabled={saving} className="btn-primary px-3 py-1">{saving ? 'جارٍ الإضافة...' : 'أضف حصة'}</button>
        </div>
      </form>

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id} className="p-3 border rounded">
            <div className="font-semibold">{e.courseName} — {e.teacherName}</div>
            <div className="text-xs text-muted-foreground">{e.day} • {e.timeSlot}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
