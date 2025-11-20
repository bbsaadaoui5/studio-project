
import { db } from "@/lib/firebase-client";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import type { Announcement } from "@/lib/types";

// Type for a new announcement, omitting the 'id' and 'createdAt' as it will be generated
export type NewAnnouncement = Omit<Announcement, 'id' | 'createdAt'>;

// Function to add a new announcement to Firestore
export const addAnnouncement = async (announcementData: NewAnnouncement): Promise<string> => {
  try {
    if (!db) throw new Error('Firestore is not initialized. Cannot add announcement.');
    const docRef = await addDoc(collection(db, "announcements"), {
        ...announcementData,
        createdAt: serverTimestamp(),
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
      // Convert Firestore Timestamp to ISO string
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      announcements.push({ id: doc.id, ...data } as Announcement);
    });
    return announcements;
  } catch (error) {
    console.error("Error getting announcements: ", error);
    throw new Error("Failed to get announcements.");
  }
};
