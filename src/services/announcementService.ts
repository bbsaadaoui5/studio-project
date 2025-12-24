
import { db } from "@/lib/firebase-client";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, Timestamp } from "firebase/firestore";
import type { Announcement } from "@/lib/types";

// Type for a new announcement, omitting the 'id' and 'createdAt' as it will be generated
export type NewAnnouncement = Omit<Announcement, 'id' | 'createdAt'>;

// Function to add a new announcement to Firestore
export const addAnnouncement = async (announcementData: NewAnnouncement, expiresInDays = 2): Promise<string> => {
  try {
    if (!db) throw new Error('Firestore is not initialized. Cannot add announcement.');
    // compute an expiresAt timestamp (default 2 days from now) so announcements auto-expire
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000));
    const docRef = await addDoc(collection(db, "announcements"), {
        ...announcementData,
        createdAt: serverTimestamp(),
        expiresAt,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding announcement: ", error);
    throw new Error("Failed to add announcement.");
  }
};

// Function to get all announcements from Firestore, ordered by creation date
export const getAnnouncements = async (count: number = 5): Promise<Announcement[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getAnnouncements() returning empty list.');
      return [];
    }
    const announcementsRef = collection(db, "announcements");
    const q = query(announcementsRef, orderBy("createdAt", "desc"), limit(count));
    const querySnapshot = await getDocs(q);
    const announcements: Announcement[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string and filter expired announcements (client-side)
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      // If expiresAt is present, normalize and skip past items
      if (data.expiresAt && typeof data.expiresAt.toDate === 'function') {
        const expires = data.expiresAt.toDate();
        if (expires <= new Date()) return; // expired -> skip
        data.expiresAt = expires.toISOString();
      }
      announcements.push({ id: doc.id, ...data } as Announcement);
    });
    return announcements;
  } catch (error) {
    console.error("Error getting announcements: ", error);
    throw new Error("Failed to get announcements.");
  }
};
