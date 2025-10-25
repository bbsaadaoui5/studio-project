// Lightweight dev mock data used when Firestore is not available locally.
// Controlled by NODE_ENV !== 'production' so production builds aren't affected.

import type { Student, Staff } from "@/lib/types";

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
