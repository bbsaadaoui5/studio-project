"use client"
import React, { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'
import { ActionIcons } from '@/components/action-icons'

import type { TimetableEntry } from '@/lib/types'
import timetableService from '@/services/timetableService'
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalFooter, GlassModalTitle, GlassModalDescription, GlassModalTrigger, GlassModalClose } from '@/components/ui/glass-modal'

export default function TimetableAdmin({ initial = [] as TimetableEntry[] }: { initial?: TimetableEntry[] }) {
  const [entries, setEntries] = useState<TimetableEntry[]>(initial)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<TimetableEntry> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Do not sync entries on every render from a non-stable `initial` prop
  // to avoid update loops when parent passes a freshly created array.
  // `entries` is initialized from `initial` above and subsequent updates
  // should be performed via `reload`, `handleAdd`, `submitEdit`, etc.

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
      courseName: payload.subject || payload.courseName || 'عام',
      teacherName: payload.teacherName || payload.teacherId || 'غير محدد',
      notes: payload.notes,
    }
    setSaving(true)
    try {
      console.debug('Timetable add payload:', body)
      // Use timetableService which is configured to call the external API in dev
      const created: TimetableEntry = await timetableService.addTimetableEntry(body as any)
      console.debug('Timetable add created object:', created)
      // ensure created has a stable id for React keys and local rendering
      if (!created.id) {
        // Use server-provided id if available, otherwise create a local temporary id
        (created as any).id = `local-${Date.now()}`
        console.debug('Assigned local id to created entry:', (created as any).id)
      }
      // prepend to local list so the UI reflects the addition immediately
      setEntries(prev => [created, ...prev])
      form.reset()
      // If backend returned a dev-style id or explicitly signaled a devFallback,
      // inform the user and DO NOT call reload() which may overwrite the local
      // optimistic entry with server-side mock data (when Firestore isn't configured).
      const isDevFallback = Boolean((created as any).devFallback) || (created?.id && String(created.id).startsWith('dev-'))
      if (isDevFallback) {
        toast({ title: 'تمت الإضافة (وضع التطوير)', description: 'تمت إضافة الحصة محليًا، لكنها قد لا تكون محفوظة في قاعدة البيانات.' })
      } else {
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة الحصة إلى الجدول.' })
        // refresh full list (useful if other components render the timetable)
        try { await reload() } catch (e) { /* ignore reload errors */ }
      }
      // dispatch a global event so other parts of the app can refresh if needed
      try { window.dispatchEvent(new CustomEvent('timetable:changed', { detail: created })) } catch (e) {}
    } catch (err) {
      console.error(err)
      toast({ title: 'خطأ', description: 'فشل في الاتصال بالخادم. يرجى المحاولة لاحقاً.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return
    // prefer service delete so it targets the external API when configured
    try {
      await timetableService.deleteTimetableEntry(id)
    } catch (e) {
      // fallback to internal API that expects id in the path
      await fetch(`/api/timetable/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }
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
      // prefer service update which may target the external API
      let updated: TimetableEntry
      try {
        updated = await timetableService.updateTimetableEntry(editingId, editingValues as any)
      } catch (e) {
        // Fallback to internal API route that expects the id in the path
        const res = await fetch(`/api/timetable/${encodeURIComponent(editingId)}`, { method: 'PUT', body: JSON.stringify(editingValues), headers: { 'Content-Type': 'application/json' } })
        if (!res.ok) throw new Error(`Server returned ${res.status}`)
        updated = await res.json()
      }
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
            <label htmlFor="edit-teacherName" className="sr-only">اسم المدرس</label>
            <input id="edit-teacherName" name="teacherName" className="col-span-3 p-2 border" value={editingValues?.teacherName || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), teacherName: ev.target.value }))} placeholder="اسم المدرس" />

            <label htmlFor="edit-courseName" className="sr-only">المادة</label>
            <input id="edit-courseName" name="courseName" className="col-span-3 p-2 border" value={editingValues?.courseName || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), courseName: ev.target.value }))} placeholder="المادة" />

            <label htmlFor="edit-day" className="sr-only">اليوم</label>
            <select id="edit-day" name="day" className="col-span-2 p-2 border" value={editingValues?.day || 'Monday'} onChange={ev => setEditingValues(v => ({ ...(v||{}), day: ev.target.value as TimetableEntry['day'] }))}>
              <option value="Monday">الاثنين</option>
              <option value="Tuesday">الثلاثاء</option>
              <option value="Wednesday">الاربعاء</option>
              <option value="Thursday">الخميس</option>
              <option value="Friday">الجمعة</option>
            </select>

            <label htmlFor="edit-timeSlot" className="sr-only">الفترة الزمنية</label>
            <input id="edit-timeSlot" name="timeSlot" className="col-span-2 p-2 border" value={editingValues?.timeSlot || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), timeSlot: ev.target.value }))} placeholder="09:00 - 10:00" />

            <label htmlFor="edit-className" className="sr-only">الشعبة</label>
            <input id="edit-className" name="className" className="col-span-2 p-2 border" value={editingValues?.className || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), className: ev.target.value }))} placeholder="الصف/الشعبة" />

            <label htmlFor="edit-grade" className="sr-only">المرحلة</label>
            <input id="edit-grade" name="grade" className="col-span-2 p-2 border" value={editingValues?.grade || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), grade: ev.target.value }))} placeholder="المرحلة" />

            <label htmlFor="edit-notes" className="sr-only">ملاحظات</label>
            <input id="edit-notes" name="notes" className="col-span-4 p-2 border" value={editingValues?.notes || ''} onChange={ev => setEditingValues(v => ({ ...(v||{}), notes: ev.target.value }))} placeholder="ملاحظات" />

            <div className="col-span-6 flex justify-end space-x-2 pt-2">
              <button type="button" onClick={cancelEdit} className="px-3 py-1 border">إلغاء</button>
              <button type="submit" disabled={saving} className="btn-primary px-3 py-1">{saving ? 'جارٍ الحفظ...' : 'احفظ'}</button>
            </div>
          </form>

        </GlassModalContent>
      </GlassModal>

      <form onSubmit={handleAdd} className="grid grid-cols-6 gap-2 mb-4">
        <label htmlFor="add-teacherId" className="sr-only">معرف المدرس</label>
        <input id="add-teacherId" name="teacherId" placeholder="معرف المدرس" className="col-span-1 p-2 border" />

        <label htmlFor="add-teacherName" className="sr-only">اسم المدرس</label>
        <input id="add-teacherName" name="teacherName" placeholder="اسم المدرس" className="col-span-1 p-2 border" />

        <label htmlFor="add-day" className="sr-only">اليوم</label>
        <select id="add-day" name="day" defaultValue="monday" className="col-span-1 p-2 border">
          <option value="monday">الاثنين</option>
          <option value="tuesday">الثلاثاء</option>
          <option value="wednesday">الأربعاء</option>
          <option value="thursday">الخميس</option>
          <option value="friday">الجمعة</option>
        </select>

        <label htmlFor="add-start" className="sr-only">وقت البدء</label>
        <input id="add-start" name="start" placeholder="09:00" className="col-span-1 p-2 border" />

        <label htmlFor="add-end" className="sr-only">وقت الانتهاء</label>
        <input id="add-end" name="end" placeholder="10:00" className="col-span-1 p-2 border" />

        <label htmlFor="add-subject" className="sr-only">المادة</label>
        <input id="add-subject" name="subject" placeholder="المادة" className="col-span-1 p-2 border" />

        <label htmlFor="add-room" className="sr-only">القاعة</label>
        <input id="add-room" name="room" placeholder="القاعة" className="col-span-1 p-2 border" />

        <div className="col-span-6 text-left">
          <button type="submit" disabled={saving} className="btn-primary px-3 py-1">{saving ? 'جارٍ الإضافة...' : 'أضف حصة'}</button>
        </div>
      </form>

      <div className="space-y-2">
        {entries.map(e => (
          <div key={e.id ?? JSON.stringify(e)} className="p-3 border rounded">
            {editingId === e.id && editingValues ? (
              <>
                <div className="text-sm">
                  <div className="font-semibold">{editingValues.teacherName} — {editingValues.courseName}</div>
                      <div className="text-xs text-muted-foreground">الصف {editingValues.grade} • الشعبة {editingValues.className} • {dayLabel(editingValues.day)} • {editingValues.timeSlot}</div>
                </div>
                <div className="space-x-2">
                  <ActionIcons
                    onEdit={() => setModalOpen(true)}
                    onDelete={() => handleDelete(e.id)}
                  />
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <div className="font-semibold">{e.teacherName} — {e.courseName}</div>
                      <div className="text-xs text-muted-foreground">الصف {e.grade} • الشعبة {e.className} • {dayLabel(e.day)} • {e.timeSlot}</div>
                </div>
                <div className="space-x-2">
                  <ActionIcons
                    onEdit={() => startEdit(e)}
                    onDelete={() => handleDelete(e.id)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function dayLabel(day?: string | null) {
  if (!day) return ''
  const map: Record<string, string> = {
    Monday: 'الاثنين',
    Tuesday: 'الثلاثاء',
    Wednesday: 'الأربعاء',
    Thursday: 'الخميس',
    Friday: 'الجمعة',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
  }
  return map[day] || day
}
