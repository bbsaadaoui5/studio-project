
import type { TimetableEntry as TT } from '@/lib/types'

// Use your app's own API route instead of external mock server
const API_URL = '/api/timetable'

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  // Allow callers to override credentials; default to 'omit' when not specified
  // to avoid sending cookies on cross-origin requests (prevents CORS failures
  // when the server responds with Access-Control-Allow-Origin: *).
  const opts: RequestInit = { ...(init || {}) }
  if (opts.credentials === undefined) opts.credentials = 'include'
  const res = await fetch(input, opts)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error(`HTTP ${res.status}: ${text}`)
    ;(err as any).status = res.status
    throw err
  }
  // Some endpoints (DELETE) may return 204 No Content — avoid calling res.json() on empty responses
  if (res.status === 204) return null
  // If Content-Type is not JSON, return raw text
  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return res.text().catch(() => null)
  }
  return res.json()
}

export async function getWeeklyTimetable(): Promise<TT[]> {
  // GET all timetable entries (server may filter by query params if provided)
  return fetchJson(API_URL, { method: 'GET' })
}

export async function getTimetableForClass(grade: string, className: string): Promise<TT[]> {
  const url = `${API_URL}?grade=${encodeURIComponent(grade)}&className=${encodeURIComponent(className)}`
  return fetchJson(url, { method: 'GET' })
}

export async function getTimetableForTeacher(teacherName: string): Promise<TT[]> {
  const url = `${API_URL}?teacherName=${encodeURIComponent(teacherName)}`
  return fetchJson(url, { method: 'GET' })
}

export async function addTimetableEntry(entry: Omit<TT, 'id'>) {
  // Log invocation so frontend console shows when UI calls this method
  try {
    // using console.log (not throwing) so it appears in browser devtools
    // even if JSON serialization has circular refs.
    console.log('[timetableService] addTimetableEntry called', entry)
  } catch (e) {
    console.log('[timetableService] addTimetableEntry called (unserializable entry)')
  }

  return fetchJson(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  })
}

export async function updateTimetableEntry(id: string, patch: Partial<TT>) {
  const url = `${API_URL}`
  return fetchJson(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...patch }),
  })
}

export async function deleteTimetableEntry(id: string) {
  const url = `${API_URL}?id=${encodeURIComponent(id)}`
  await fetchJson(url, { method: 'DELETE' })
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
