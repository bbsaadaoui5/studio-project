// @ts-nocheck
import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('🎯 API CALL:', req.method, '/api/timetable')
  
  if (req.method === 'GET') {
    return res.status(200).json([
      { id: '1', message: 'API is working!', day: 'Monday' }
    ])
  }
  
  if (req.method === 'POST') {
    console.log('📝 POST Data:', req.body)
    const newEntry = {
      id: `mock-${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString()
    }
    return res.status(201).json(newEntry)
  }
  
  return res.status(405).json({ error: 'Method not allowed' })
}