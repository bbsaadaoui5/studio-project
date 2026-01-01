import { db, auth } from "@/lib/firebase-client";
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, serverTimestamp } from "firebase/firestore";
import type { Parent } from "@/lib/types";

const PARENTS_COLLECTION = "parents";

export const getParent = async (id: string): Promise<Parent | null> => {
  if (!db) {
    console.warn('Firestore not initialized. getParent() returning null.');
    return null;
  }
  const ref = doc(db, PARENTS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const data = snap.data();
  const normalized: Partial<Parent> = { ...data } as Partial<Parent>;
  if (data.createdAt && typeof data.createdAt.toDate === 'function') {
    normalized.createdAt = data.createdAt.toDate().toISOString();
  }
  return { id: snap.id, name: normalized.name || '', email: normalized.email || '', phone: normalized.phone, linkedStudentIds: normalized.linkedStudentIds || [], createdAt: normalized.createdAt || new Date().toISOString(), status: (normalized.status as Parent['status']) || 'active' } as Parent;
}

export const getParents = async (): Promise<Parent[]> => {
  if (!db) {
    console.warn('Firestore not initialized. getParents() returning empty list.');
    return [];
  }
  const q = query(collection(db, PARENTS_COLLECTION));
  const snap = await getDocs(q);
  const results: Parent[] = [];
  snap.forEach(d => {
    const data = d.data();
    const normalized: Partial<Parent> = { ...data } as Partial<Parent>;
    if (data.createdAt && typeof data.createdAt.toDate === 'function') {
      normalized.createdAt = data.createdAt.toDate().toISOString();
    }
    results.push({ id: d.id, name: normalized.name || '', email: normalized.email || '', phone: normalized.phone, linkedStudentIds: normalized.linkedStudentIds || [], createdAt: normalized.createdAt || new Date().toISOString(), status: (normalized.status as Parent['status']) || 'active' } as Parent);
  });
  return results;
}

export const createOrUpdateParent = async (parent: Omit<Parent, 'createdAt'> & { createdAt?: string }): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized. Cannot create or update parent.');
  const ref = doc(db, PARENTS_COLLECTION, parent.id);
  await setDoc(ref, {
    ...parent,
    createdAt: serverTimestamp(),
  }, { merge: true });
}

export const linkStudentToParent = async (parentId: string, studentId: string): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized. Cannot link student to parent.');
  const ref = doc(db, PARENTS_COLLECTION, parentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Parent not found");
  }
  const data = snap.data();
  const linked: string[] = Array.isArray(data?.linkedStudentIds) ? data.linkedStudentIds : [];
  if (!linked.includes(studentId)) linked.push(studentId);
  await updateDoc(ref, { linkedStudentIds: linked });
}

export const unlinkStudentFromParent = async (parentId: string, studentId: string): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized. Cannot unlink student from parent.');
  const ref = doc(db, PARENTS_COLLECTION, parentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();
  const linked: string[] = Array.isArray(data?.linkedStudentIds) ? data.linkedStudentIds : [];
  await updateDoc(ref, { linkedStudentIds: linked.filter(id => id !== studentId) });
}


