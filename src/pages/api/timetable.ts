import type { NextApiRequest, NextApiResponse } from 'next'
import timetableService from '@/services/timetableService'
import type { TimetableEntry } from '@/lib/types'

const VALID_DAYS: TimetableEntry['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function validatePayload(payload: any, requireAll = true) {
  const errors: string[] = []
  if (requireAll) {
    if (!payload.grade) errors.push('missing grade')
    if (!payload.className) errors.push('missing className')
    if (!payload.day) errors.push('missing day')
    if (!payload.timeSlot) errors.push('missing timeSlot')
    if (!payload.courseName) errors.push('missing courseName')
    if (!payload.teacherName) errors.push('missing teacherName')
  } else {
    // for PATCH-like updates, require at least one editable field
    const editable = ['grade', 'className', 'day', 'timeSlot', 'courseName', 'teacherName', 'notes']
    const has = editable.some(k => payload[k] !== undefined)
    if (!has) errors.push('no editable fields provided')
  }

  if (payload.day && !VALID_DAYS.includes(payload.day)) errors.push('invalid day')

  return errors
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const items = await timetableService.getWeeklyTimetable()
      return res.status(200).json(items)
    }

    if (req.method === 'POST') {
      const body = req.body
      const errors = validatePayload(body, true)
      if (errors.length) return res.status(400).json({ error: 'validation', details: errors })
      const created = await timetableService.addTimetableEntry(body)
      return res.status(201).json(created)
    }

    if (req.method === 'PUT') {
      const { id, ...patch } = req.body
      if (!id) return res.status(400).json({ error: 'missing id' })
      const errors = validatePayload(patch, false)
      if (errors.length) return res.status(400).json({ error: 'validation', details: errors })
      const updated = await timetableService.updateTimetableEntry(id, patch)
      return res.status(200).json(updated)
    }

    if (req.method === 'DELETE') {
      const id = req.query.id as string
      if (!id) return res.status(400).json({ error: 'missing id' })
      await timetableService.deleteTimetableEntry(id)
      return res.status(200).json({ success: true })
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error('Timetable API error', e)
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
}
