import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase-client'
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, DocumentData } from 'firebase/firestore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })
    }

    const searchParams = request.nextUrl.searchParams
    const grade = searchParams.get('grade')
    const className = searchParams.get('className')
    const teacherName = searchParams.get('teacherName')

    let q: any
    const timetablesRef = collection(db, 'timetables')

    if (grade && className) {
      q = query(timetablesRef, where('grade', '==', grade), where('className', '==', className))
    } else if (teacherName) {
      q = query(timetablesRef, where('teacherName', '==', teacherName))
    } else {
      q = query(timetablesRef)
    }

    const snapshot = await getDocs(q)
    const data: any[] = []
    snapshot.forEach((docSnap: DocumentData) => {
      data.push({ id: docSnap.id, ...docSnap.data() })
    })
    return NextResponse.json(data)
  } catch (error) {
    console.error('GET /api/timetable error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timetable data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })
    }

    const entry = await request.json()
    const timetablesRef = collection(db, 'timetables')
    const docRef = await addDoc(timetablesRef, {
      ...entry,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return NextResponse.json({ id: docRef.id, ...entry }, { status: 201 })
  } catch (error) {
    console.error('POST /api/timetable error:', error)
    return NextResponse.json(
      { error: 'Failed to create timetable entry' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })
    }

    const body = await request.json()
    const { id, ...updateData } = body
    const docRef = doc(db, 'timetables', id)
    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    })
    return NextResponse.json({ id, ...updateData })
  } catch (error) {
    console.error('PUT /api/timetable error:', error)
    return NextResponse.json(
      { error: 'Failed to update timetable entry' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Firebase not configured' }, { status: 503 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const docRef = doc(db, 'timetables', id)
    await deleteDoc(docRef)
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('DELETE /api/timetable error:', error)
    return NextResponse.json(
      { error: 'Failed to delete timetable entry' },
      { status: 500 }
    )
  }
}
