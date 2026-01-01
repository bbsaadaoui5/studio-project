import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '@/lib/firebase-client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Handle GET requests
    if (req.method === 'GET') {
      if (!db) {
        return res.status(503).json({ error: 'Firebase not configured' })
      }

      try {
        const { grade, className, teacherName } = req.query

        let query = db.collection('timetables')

        if (grade && className) {
          query = query.where('grade', '==', grade).where('className', '==', className)
        } else if (teacherName) {
          query = query.where('teacherName', '==', teacherName)
        }

        const snapshot = await query.get()
        const data: any[] = []
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...doc.data() })
        })
        return res.status(200).json(data)
      } catch (error) {
        console.error('GET /api/timetable error:', error)
        return res.status(500).json({ error: 'Failed to fetch timetable data' })
      }
    }

    // Handle POST requests
    if (req.method === 'POST') {
      if (!db) {
        return res.status(503).json({ error: 'Firebase not configured' })
      }

      try {
        const entry = req.body
        const docRef = await db.collection('timetables').add({
          ...entry,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        return res.status(201).json({ id: docRef.id, ...entry })
      } catch (error) {
        console.error('POST /api/timetable error:', error)
        return res.status(500).json({ error: 'Failed to create timetable entry' })
      }
    }

    // Handle PUT requests (updates)
    if (req.method === 'PUT') {
      if (!db) {
        return res.status(503).json({ error: 'Firebase not configured' })
      }

      try {
        const { id, ...updateData } = req.body
        await db.collection('timetables').doc(id).update({
          ...updateData,
          updatedAt: new Date().toISOString(),
        })
        return res.status(200).json({ id, ...updateData })
      } catch (error) {
        console.error('PUT /api/timetable error:', error)
        return res.status(500).json({ error: 'Failed to update timetable entry' })
      }
    }

    // Handle DELETE requests
    if (req.method === 'DELETE') {
      if (!db) {
        return res.status(503).json({ error: 'Firebase not configured' })
      }

      try {
        const { id } = req.query
        await db.collection('timetables').doc(id as string).delete()
        return res.status(204).end()
      } catch (error) {
        console.error('DELETE /api/timetable error:', error)
        return res.status(500).json({ error: 'Failed to delete timetable entry' })
      }
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error) {
    console.error('Unhandled error in /api/timetable:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}