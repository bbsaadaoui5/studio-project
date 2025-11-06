"use client"
import React, { useEffect, useState } from 'react'

import type { TimetableEntry } from '@/lib/types'
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalFooter, GlassModalTitle, GlassModalDescription, GlassModalTrigger, GlassModalClose } from '@/components/ui/glass-modal'

export default function TimetableAdmin({ initial = [] as TimetableEntry[] }: { initial?: TimetableEntry[] }) {
  const [entries, setEntries] = useState<TimetableEntry[]>(initial)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<TimetableEntry> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)

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
      day: ((payload.day as string) || 'Monday').replace(/^./, s => s.toUpperCase()) as TimetableEntry['day'],
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

  function startEdit(entry: TimetableEntry) {
    setEditingId(entry.id)
    setEditingValues({ ...entry })
    setModalOpen(true)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditingValues(null)
    setModalOpen(false)
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId || !editingValues) return
    // basic validation
    if (!editingValues.courseName || !editingValues.teacherName || !editingValues.day || !editingValues.timeSlot) {
      alert('الرجاء ملء الحقول المطلوبة: المادة، المدرس، اليوم، والوقت')
      return
    }
    try {
      setSaving(true)
      const payload = { id: editingId, ...editingValues }
      const res = await fetch('/api/timetable', { method: 'PUT', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const updated: TimetableEntry = await res.json()
      setEntries(prev => prev.map(x => x.id === updated.id ? updated : x))
      cancelEdit()
    } catch (err) {
      console.error(err)
      alert('فشل تحديث الحصة — حاول مرة أخرى')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">الجدول الدراسي (لوحة الإدارة)</h2>
        <div>
          <button onClick={reload} className="btn">{loading ? 'جارٍ...' : 'تحديث'}</button>
        </div>
      </div>

      {/* Edit modal */}
      <GlassModal open={modalOpen} onOpenChange={(v) => { if (!v) cancelEdit(); setModalOpen(v) }}>
        <GlassModalContent>
          <GlassModalHeader>
            <GlassModalTitle>تعديل الحصة</GlassModalTitle>
            <GlassModalDescription>قم بتعديل معلومات الحصة ثم اضغط حفظ.</GlassModalDescription>
          </GlassModalHeader>

          <form onSubmit={submitEdit} className="grid grid-cols-6 gap-2 mt-2">
            <input className="col-span-3 p-2 border" value={editingValues?.teacherName || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), teacherName: ev.target.value }))} placeholder="اسم المدرس" />
            <input className="col-span-3 p-2 border" value={editingValues?.courseName || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), courseName: ev.target.value }))} placeholder="المادة" />

            <select className="col-span-2 p-2 border" value={editingValues?.day || 'Monday'} onChange={ev => setEditingValues(v => ({ ...(v||{}), day: ev.target.value as TimetableEntry['day'] }))}>
              <option value="Monday">الاثنين</option>
              <option value="Tuesday">الثلاثاء</option>
              <option value="Wednesday">الاربعاء</option>
              <option value="Thursday">الخميس</option>
              <option value="Friday">الجمعة</option>
            </select>
            <input className="col-span-2 p-2 border" value={editingValues?.timeSlot || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), timeSlot: ev.target.value }))} placeholder="09:00 - 10:00" />
            <input className="col-span-2 p-2 border" value={editingValues?.className || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), className: ev.target.value }))} placeholder="الصف/الشعبة" />

            <input className="col-span-2 p-2 border" value={editingValues?.grade || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), grade: ev.target.value }))} placeholder="المرحلة" />
            <input className="col-span-4 p-2 border" value={editingValues?.notes || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), notes: ev.target.value }))} placeholder="ملاحظات" />

            <div className="col-span-6 flex justify-end space-x-2 pt-2">
              <button type="button" onClick={cancelEdit} className="px-3 py-1 border">إلغاء</button>
              <button type="submit" disabled={saving} className="btn-primary px-3 py-1">{saving ? 'جارٍ الحفظ...' : 'احفظ'}</button>
            </div>
          </form>

        </GlassModalContent>
      </GlassModal>

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
          <div key={e.id ?? JSON.stringify(e)} className="p-3 border rounded">
            {editingId === e.id && editingValues ? (
              <>
                <div className="text-sm">
                  <div className="font-semibold">{editingValues.teacherName} — {editingValues.courseName}</div>
                  <div className="text-xs text-muted-foreground">Grade {editingValues.grade} • Class {editingValues.className} • {editingValues.day} • {editingValues.timeSlot}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => setModalOpen(true)} className="text-sm text-blue-600">تعديل (فتح النافذة)</button>
                  <button onClick={() => handleDelete(e.id)} className="text-sm text-red-600">حذف</button>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <div className="font-semibold">{e.teacherName} — {e.courseName}</div>
                  <div className="text-xs text-muted-foreground">Grade {e.grade} • Class {e.className} • {e.day} • {e.timeSlot}</div>
                </div>
                <div className="space-x-2">
                  <button onClick={() => startEdit(e)} className="text-sm text-blue-600">تعديل</button>
                  <button onClick={() => handleDelete(e.id)} className="text-sm text-red-600">حذف</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
