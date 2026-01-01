import { db } from '@/lib/firebase-client';
import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';

export type Goal = {
  id?: string;
  studentId: string;
  title: string;
  notes?: string;
  targetDate?: string;
  status?: 'active' | 'completed' | 'archived';
  createdAt?: string;
}

export const addGoal = async (studentId: string, goal: Omit<Goal, 'id' | 'studentId' | 'createdAt'>) => {
  if (!db) throw new Error('Firestore not initialized');
  const col = collection(db, 'studentGoals');
  const docRef = await addDoc(col, { studentId, ...goal, status: goal.status || 'active', createdAt: new Date().toISOString() });
  return docRef.id;
}

export const getGoalsForStudent = async (studentId: string) => {
  if (!db) return [];
  const col = collection(db, 'studentGoals');
  const q = query(col, where('studentId', '==', studentId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const out: any[] = [];
  snap.forEach(d => out.push({ id: d.id, ...d.data() }));
  return out;
}

export const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
  if (!db) throw new Error('Firestore not initialized');
  const ref = doc(db, 'studentGoals', goalId);
  await updateDoc(ref, updates as any);
}

export const addProgressEntry = async (goalId: string, entry: { percent?: number; note?: string }) => {
  if (!db) throw new Error('Firestore not initialized');
  const col = collection(db, `studentGoals/${goalId}/progress`);
  const docRef = await addDoc(col, { ...entry, createdAt: new Date().toISOString() });
  return docRef.id;
}
