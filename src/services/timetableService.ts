import { db } from '@/lib/firebase-client'

export interface TimetableEntry {
  id?: string
  teacherId: string
  teacherName?: string
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
  start: string // HH:MM
  end: string // HH:MM
  subject: string
  room?: string
}

// Simple dev fallback if `db` is not configured
const devFallback: TimetableEntry[] = [
  { id: 't1', teacherId: 't-1', teacherName: 'أ. سمير', day: 'monday', start: '09:00', end: '10:00', subject: 'رياضيات', room: 'A101' },
  { id: 't2', teacherId: 't-2', teacherName: 'أ. ليلى', day: 'monday', start: '10:00', end: '11:00', subject: 'فيزياء', room: 'B201' },
  { id: 't3', teacherId: 't-1', teacherName: 'أ. سمير', day: 'wednesday', start: '11:00', end: '12:00', subject: 'رياضيات', room: 'A101' },
]

export async function getWeeklyTimetable(): Promise<TimetableEntry[]> {
  if (!db) return devFallback
  try {
    const snap = await db.collection('timetables').get()
    const items: TimetableEntry[] = []
    snap.forEach(doc => {
      items.push({ id: doc.id, ...(doc.data() as any) })
    })
    return items
  } catch (e) {
    // If Firestore read fails, return fallback
    // eslint-disable-next-line no-console
    console.error('Failed to load timetable', e)
    return devFallback
  }
}

export async function getTimetableForClass(grade: string, className: string): Promise<TimetableEntry[]> {
  const all = await getWeeklyTimetable()
  // naive client-side filter for simplicity in this implementation
  return all.filter(t => (t as any).grade === grade && (t as any).className === className)
}

export async function getTimetableForTeacher(teacherName: string): Promise<TimetableEntry[]> {
  const all = await getWeeklyTimetable()
  return all.filter(t => t.teacherName === teacherName || t.teacherId === teacherName)
}

export async function addTimetableEntry(entry: TimetableEntry) {
  if (!db) {
    // return a pseudo-id for dev fallback
    const id = `dev-${Date.now()}`
    return { id, ...entry }
  }
  const ref = await db.collection('timetables').add(entry)
  return { id: ref.id, ...entry }
}

export async function updateTimetableEntry(id: string, patch: Partial<TimetableEntry>) {
  if (!db) {
    return { id, ...patch }
  }
  await db.collection('timetables').doc(id).update(patch)
  return { id, ...patch }
}

export async function deleteTimetableEntry(id: string) {
  if (!db) return true
  await db.collection('timetables').doc(id).delete()
  return true
}

export default {
  getWeeklyTimetable,
  getTimetableForClass,
  getTimetableForTeacher,
  addTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
}
