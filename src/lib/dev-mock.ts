// Lightweight dev mock data used when Firestore is not available locally.
// Controlled by NODE_ENV !== 'production' so production builds aren't affected.

import type { Student, Staff, TimetableEntry } from "@/lib/types";

export const MOCK_STUDENTS: Student[] = [
  {
    id: "STU1001",
    idNumber: "STU1001",
    firstName: "Ali",
    lastName: "Haddad",
    fullName: "Ali Haddad",
    grade: "3",
    className: "A",
    status: "active",
    enrollmentDate: new Date().toISOString(),
  } as unknown as Student,
  {
    id: "STU1002",
    idNumber: "STU1002",
    firstName: "Sara",
    lastName: "Khalil",
    fullName: "Sara Khalil",
    grade: "2",
    className: "B",
    status: "active",
    enrollmentDate: new Date().toISOString(),
  } as unknown as Student,
];

export const MOCK_STAFF: Staff[] = [
  {
    id: "T001",
    name: "Mona Ahmed",
    email: "mona@example.com",
    role: "teacher",
    status: "active",
  } as unknown as Staff,
];

export function isDevMockEnabled() {
  // Allow explicit opt-in via USE_DEV_MOCK=true, otherwise enable in non-production.
  if (process.env.USE_DEV_MOCK === 'true') return true;
  return process.env.NODE_ENV !== 'production';
}

export async function getMockStudents(): Promise<Student[]> {
  return MOCK_STUDENTS;
}

export async function getMockStudent(id: string): Promise<Student | null> {
  const s = MOCK_STUDENTS.find(s => s.id === id || s.idNumber === id);
  return s || null;
}

export async function getMockStaffMembers(): Promise<Staff[]> {
  return MOCK_STAFF;
}

export async function getMockStaffMember(id: string): Promise<Staff | null> {
  const s = MOCK_STAFF.find(s => s.id === id);
  return s || null;
}

// Richer timetable mock data for local demos
const MOCK_TIMETABLE: TimetableEntry[] = [
  { id: 't1', grade: '9', className: 'A', day: 'Monday', timeSlot: '08:00 - 08:45', courseId: 'c-math', courseName: 'رياضيات', teacherName: 'أ. سمير', notes: '' },
  { id: 't2', grade: '9', className: 'A', day: 'Monday', timeSlot: '08:50 - 09:35', courseId: 'c-eng', courseName: 'انكليزي', teacherName: 'أ. ليلى', notes: '' },
  { id: 't3', grade: '9', className: 'A', day: 'Tuesday', timeSlot: '09:40 - 10:25', courseId: 'c-phy', courseName: 'فيزياء', teacherName: 'أ. كريم', notes: '' },
  { id: 't4', grade: '9', className: 'B', day: 'Monday', timeSlot: '08:00 - 08:45', courseId: 'c-bio', courseName: 'أحياء', teacherName: 'أ. يسرا', notes: '' },
  { id: 't5', grade: '10', className: 'A', day: 'Wednesday', timeSlot: '10:30 - 11:15', courseId: 'c-chem', courseName: 'كيمياء', teacherName: 'أ. خالد', notes: '' },
  { id: 't6', grade: '11', className: 'C', day: 'Thursday', timeSlot: '11:20 - 12:05', courseId: 'c-his', courseName: 'تاريخ', teacherName: 'أ. مريم', notes: '' },
]

export async function getMockTimetable(): Promise<TimetableEntry[]> {
  // Return a cloned array so callers can mutate safely
  return MOCK_TIMETABLE.map(t => ({ ...t }))
}
