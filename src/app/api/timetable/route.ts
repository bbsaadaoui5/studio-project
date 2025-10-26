import { NextResponse } from 'next/server'
import timetableService from '@/services/timetableService'

export async function GET(request: Request) {
  const items = await timetableService.getWeeklyTimetable()
  return NextResponse.json(items)
}

export async function POST(request: Request) {
  const body = await request.json()
  const created = await timetableService.addTimetableEntry(body)
  return NextResponse.json(created)
}

export async function PUT(request: Request) {
  const body = await request.json()
  const { id, ...patch } = body
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  const updated = await timetableService.updateTimetableEntry(id, patch)
  return NextResponse.json(updated)
}

export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })
  await timetableService.deleteTimetableEntry(id)
  return NextResponse.json({ success: true })
}
