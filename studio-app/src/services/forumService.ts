import { db } from "@/lib/firebase-client";
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, doc, getDoc, collection as collectionRef, updateDoc } from "firebase/firestore";
import type { Student } from "@/lib/types";

export type NewThread = {
  classKey: string; // e.g., "9-A" or combination
  title: string;
  content: string;
  author?: string;
}

export const createThread = async (thread: NewThread): Promise<string> => {
  if (!db) throw new Error('Firestore not initialized');
  const col = collection(db, 'classForums');
  const docRef = await addDoc(col, { ...thread, createdAt: serverTimestamp(), flagged: false });
  return docRef.id;
}

export const getThreadsForClass = async (classKey: string, limitCount = 50) => {
  if (!db) return [];
  const col = collection(db, 'classForums');
  const q = query(col, where('classKey', '==', classKey), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const threads: any[] = [];
  snap.forEach(d => threads.push({ id: d.id, ...d.data() }));
  return threads;
}

export const getThread = async (threadId: string) => {
  if (!db) return null;
  const docRef = doc(db, 'classForums', threadId);
  const d = await getDoc(docRef);
  if (!d.exists()) return null;
  const data = { id: d.id, ...d.data() };

  // load replies
  const repliesCol = collectionRef(db, `classForums/${threadId}/replies`);
  const repliesSnap = await getDocs(query(repliesCol, orderBy('createdAt', 'asc')));
  const replies: any[] = [];
  repliesSnap.forEach(r => replies.push({ id: r.id, ...r.data() }));

  return { ...data, replies };
}

export const addReply = async (threadId: string, content: string, author?: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const repliesCol = collectionRef(db, `classForums/${threadId}/replies`);
  const docRef = await addDoc(repliesCol, { content, author: author || 'Parent', createdAt: serverTimestamp(), flagged: false });
  return docRef.id;
}

export const flagItem = async (path: string) => {
  if (!db) throw new Error('Firestore not initialized');
  const itemRef = doc(db, path);
  await updateDoc(itemRef, { flagged: true });
}
