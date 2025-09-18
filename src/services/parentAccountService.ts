import { db, auth } from "@/lib/firebase-client";
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp } from "firebase/firestore";
import type { Parent } from "@/lib/types";

const PARENTS_COLLECTION = "parents";

export const getParent = async (id: string): Promise<Parent | null> => {
  const ref = doc(db, PARENTS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    data.createdAt = data.createdAt.toDate().toISOString();
  }
  return { id: snap.id, ...(data as any) } as Parent;
}

export const getParents = async (): Promise<Parent[]> => {
  const q = query(collection(db, PARENTS_COLLECTION));
  const snap = await getDocs(q);
  const results: Parent[] = [];
  snap.forEach(d => {
    const data = d.data();
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      data.createdAt = data.createdAt.toDate().toISOString();
    }
    results.push({ id: d.id, ...(data as any) } as Parent);
  });
  return results;
}

export const createOrUpdateParent = async (parent: Omit<Parent, 'createdAt'> & { createdAt?: string }): Promise<void> => {
  const ref = doc(db, PARENTS_COLLECTION, parent.id);
  await setDoc(ref, {
    ...parent,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export const linkStudentToParent = async (parentId: string, studentId: string): Promise<void> => {
  const ref = doc(db, PARENTS_COLLECTION, parentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Parent not found");
  }
  const data = snap.data() as any;
  const linked: string[] = Array.isArray(data.linkedStudentIds) ? data.linkedStudentIds : [];
  if (!linked.includes(studentId)) linked.push(studentId);
  await updateDoc(ref, { linkedStudentIds: linked });
}

export const unlinkStudentFromParent = async (parentId: string, studentId: string): Promise<void> => {
  const ref = doc(db, PARENTS_COLLECTION, parentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as any;
  const linked: string[] = Array.isArray(data.linkedStudentIds) ? data.linkedStudentIds : [];
  await updateDoc(ref, { linkedStudentIds: linked.filter(id => id !== studentId) });
}


