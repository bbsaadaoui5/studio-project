import { db } from '@/lib/firebase-client'
import type { TimetableEntry as TT } from '@/lib/types'
import { isDevMockEnabled, getMockTimetable } from '@/lib/dev-mock'

export async function getWeeklyTimetable(): Promise<TT[]> {
  // If dev mocks are enabled, return the mock timetable
  if (isDevMockEnabled()) return getMockTimetable()
  if (!db) return getMockTimetable()
  try {
    const snap = await db.collection('timetables').get()
    const items: TT[] = []
    snap.forEach((doc: any) => {
      items.push({ id: doc.id, ...(doc.data() as any) })
    })
    return items
  } catch (e) {
    // If Firestore read fails, return fallback
    // eslint-disable-next-line no-console
    console.error('Failed to load timetable', e)
    return getMockTimetable()
  }
}

export async function getTimetableForClass(grade: string, className: string): Promise<TT[]> {
  const all = await getWeeklyTimetable()
  // naive client-side filter for simplicity in this implementation
  return all.filter(t => (t as any).grade === grade && (t as any).className === className)
}

export async function getTimetableForTeacher(teacherName: string): Promise<TT[]> {
  const all = await getWeeklyTimetable()
  return all.filter(t => t.teacherName === teacherName || t.teacherName === teacherName)
}

export async function addTimetableEntry(entry: Omit<TT, 'id'>) {
  if (!db) {
    // return a pseudo-id for dev fallback
    const id = `dev-${Date.now()}`
    return { id, ...(entry as any) } as TT
  }
  const ref = await db.collection('timetables').add(entry)
  const result = { ...(entry as any) } as any
  result.id = ref.id
  return result as TT
}

export async function updateTimetableEntry(id: string, patch: Partial<TT>) {
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

const timetableService = {
  getWeeklyTimetable,
  getTimetableForClass,
  getTimetableForTeacher,
  addTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
}

export default timetableService
