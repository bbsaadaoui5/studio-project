import type { NextApiRequest, NextApiResponse } from 'next'
import timetableService from '@/services/timetableService'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const items = await timetableService.getWeeklyTimetable()
      return res.status(200).json(items)
    }

    if (req.method === 'POST') {
      const body = req.body
      const created = await timetableService.addTimetableEntry(body)
      return res.status(201).json(created)
    }

    if (req.method === 'PUT') {
      const { id, ...patch } = req.body
      if (!id) return res.status(400).json({ error: 'missing id' })
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
