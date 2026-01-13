
import { db } from "@/lib/firebase-client";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where, orderBy, limit, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import type { Announcement } from "@/lib/types";

// Type for a new announcement, omitting the 'id' and 'createdAt' as it will be generated
export type NewAnnouncement = Omit<Announcement, 'id' | 'createdAt'>;

// Function to add a new announcement to Firestore
export const addAnnouncement = async (announcementData: NewAnnouncement): Promise<string> => {
  try {
    if (!db) throw new Error('Firestore is not initialized. Cannot add announcement.');
    
    const publishDate = new Date(announcementData.publishDate);
    const expiryDate = new Date(publishDate.getTime() + announcementData.durationDays * 24 * 60 * 60 * 1000);
    const eventDate = announcementData.eventDate ? new Date(announcementData.eventDate) : undefined;
    const now = new Date();
    
    // Determine status based on publish date
    let status: 'active' | 'scheduled' = publishDate <= now ? 'active' : 'scheduled';
    
    const docRef = await addDoc(collection(db, "announcements"), {
        ...announcementData,
        publishDate: Timestamp.fromDate(publishDate),
        expiryDate: Timestamp.fromDate(expiryDate),
        eventDate: eventDate ? Timestamp.fromDate(eventDate) : null,
        status,
        createdAt: serverTimestamp(),
        viewCount: 0,
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding announcement: ", error);
    throw new Error("Failed to add announcement.");
  }
};

// Function to update an announcement
export const updateAnnouncement = async (id: string, updates: Partial<Announcement>): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized.');
    
    const announcementRef = doc(db, "announcements", id);
    const updateData: any = { ...updates };
    
    // Convert date strings to Timestamps if provided
    if (updates.publishDate) {
      updateData.publishDate = Timestamp.fromDate(new Date(updates.publishDate));
      
      // Recalculate expiryDate if publishDate or durationDays changed
      if (updates.durationDays || updates.publishDate) {
        const duration = updates.durationDays || 2;
        const publishDate = new Date(updates.publishDate);
        const expiryDate = new Date(publishDate.getTime() + duration * 24 * 60 * 60 * 1000);
        updateData.expiryDate = Timestamp.fromDate(expiryDate);
      }
    }
    
    if (updates.eventDate) {
      updateData.eventDate = Timestamp.fromDate(new Date(updates.eventDate));
    }
    
    await updateDoc(announcementRef, updateData);
  } catch (error) {
    console.error("Error updating announcement: ", error);
    throw new Error("Failed to update announcement.");
  }
};

// Function to delete an announcement
export const deleteAnnouncement = async (id: string): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized.');
    await deleteDoc(doc(db, "announcements", id));
  } catch (error) {
    console.error("Error deleting announcement: ", error);
    throw new Error("Failed to delete announcement.");
  }
};

// Get active announcements (published and not expired)
export const getActiveAnnouncements = async (audience?: string, count: number = 5): Promise<Announcement[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getActiveAnnouncements() returning empty list.');
      return [];
    }
    
    const now = Timestamp.now();
    const announcementsRef = collection(db, "announcements");
    
    // Fetch active announcements only - filter dates in memory to avoid Firebase inequality limitation
    // Remove orderBy to avoid requiring composite index
    let q = query(
      announcementsRef,
      where("status", "==", "active")
    );
    
    const querySnapshot = await getDocs(q);
    console.log('🔍 getActiveAnnouncements - Fetched from DB:', querySnapshot.size, 'documents');
    const announcements: Announcement[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`  📄 Processing announcement "${data.title}":`, {
        status: data.status,
        audience: data.audience,
        publishDate: data.publishDate?.toDate?.(),
        expiryDate: data.expiryDate?.toDate?.(),
      });
      
      // Filter by dates in memory
      const publishDate = data.publishDate;
      const expiryDate = data.expiryDate;
      
      if (publishDate && publishDate > now) {
        console.log(`    ⏳ Not yet published`);
        return; // Not yet published
      }
      
      if (expiryDate && expiryDate < now) {
        console.log(`    ⏰ Already expired`);
        return; // Already expired
      }
      
      // Filter by audience if specified
      if (audience && data.audience !== 'all' && data.audience !== audience) {
        console.log(`    👥 Filtered by audience: (looking for "${audience}", has "${data.audience}")`);
        return;
      }
      
      // Convert Timestamps to ISO strings
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.publishDate && typeof data.publishDate.toDate === 'function') {
        data.publishDate = data.publishDate.toDate().toISOString();
      }
      if (data.expiryDate && typeof data.expiryDate.toDate === 'function') {
        data.expiryDate = data.expiryDate.toDate().toISOString();
      }
      if (data.eventDate && typeof data.eventDate.toDate === 'function') {
        data.eventDate = data.eventDate.toDate().toISOString();
      }
      
      console.log(`    ✅ Announcement passed filters, adding to results`);
      announcements.push({ id: doc.id, ...data } as Announcement);
    });
    
    console.log(`📊 After filtering: ${announcements.length} announcements passed all filters`);
    
    // Sort by priority (urgent > important > normal) and then by publishDate
    const priorityOrder = { urgent: 3, important: 2, normal: 1 };
    announcements.sort((a, b) => {
      const priorityDiff = (priorityOrder[b.priority || 'normal'] || 1) - (priorityOrder[a.priority || 'normal'] || 1);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
    
    // Limit results
    const final = announcements.slice(0, count);
    console.log(`✨ Returning ${final.length} announcements to caller`);
    return final;
  } catch (error) {
    console.error("Error getting active announcements: ", error);
    throw new Error("Failed to get active announcements.");
  }
};

// Get announcements by status
export const getAnnouncementsByStatus = async (status: 'active' | 'archived' | 'scheduled'): Promise<Announcement[]> => {
  try {
    if (!db) return [];
    
    const announcementsRef = collection(db, "announcements");
    // Fetch by status only, sort in memory to avoid composite index requirement
    const q = query(
      announcementsRef,
      where("status", "==", status)
    );
    
    const querySnapshot = await getDocs(q);
    const announcements: Announcement[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert Timestamps to ISO strings
      if (data.createdAt && typeof data.createdAt.toDate === 'function') {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      if (data.publishDate && typeof data.publishDate.toDate === 'function') {
        data.publishDate = data.publishDate.toDate().toISOString();
      }
      if (data.expiryDate && typeof data.expiryDate.toDate === 'function') {
        data.expiryDate = data.expiryDate.toDate().toISOString();
      }
      if (data.eventDate && typeof data.eventDate.toDate === 'function') {
        data.eventDate = data.eventDate.toDate().toISOString();
      }
      
      announcements.push({ id: doc.id, ...data } as Announcement);
    });
    
    // Sort by publishDate in memory
    announcements.sort((a, b) => {
      return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    });
    
    return announcements;
  } catch (error) {
    console.error("Error getting announcements by status: ", error);
    throw new Error("Failed to get announcements.");
  }
};

// Archive expired announcements (run automatically or manually)
export const archiveExpiredAnnouncements = async (): Promise<number> => {
  try {
    if (!db) throw new Error('Firestore is not initialized.');
    
    const now = Timestamp.now();
    const announcementsRef = collection(db, "announcements");
    
    // Fetch all active announcements and filter in memory to avoid composite index requirement
    const q = query(
      announcementsRef,
      where("status", "==", "active")
    );
    
    const querySnapshot = await getDocs(q);
    const expiredDocs = [];
    
    // Filter expired announcements in memory
    querySnapshot.forEach((document) => {
      const data = document.data();
      if (data.expiryDate && data.expiryDate < now) {
        expiredDocs.push(document);
      }
    });
    
    if (expiredDocs.length === 0) return 0;
    
    const batch = writeBatch(db);
    expiredDocs.forEach((document) => {
      batch.update(document.ref, { status: "archived" });
    });
    
    await batch.commit();
    return expiredDocs.length;
  } catch (error) {
    console.error("Error archiving expired announcements: ", error);
    throw new Error("Failed to archive announcements.");
  }
};

// Activate scheduled announcements (run automatically or manually)
export const activateScheduledAnnouncements = async (): Promise<number> => {
  try {
    if (!db) throw new Error('Firestore is not initialized.');
    
    const now = Timestamp.now();
    const announcementsRef = collection(db, "announcements");
    
    // Fetch all scheduled announcements and filter in memory to avoid composite index requirement
    const q = query(
      announcementsRef,
      where("status", "==", "scheduled")
    );
    
    const querySnapshot = await getDocs(q);
    const readyDocs = [];
    
    // Filter announcements ready to be activated in memory
    querySnapshot.forEach((document) => {
      const data = document.data();
      if (data.publishDate && data.publishDate <= now) {
        readyDocs.push(document);
      }
    });
    
    if (readyDocs.length === 0) return 0;
    
    const batch = writeBatch(db);
    readyDocs.forEach((document) => {
      batch.update(document.ref, { status: "active" });
    });
    
    await batch.commit();
    return readyDocs.length;
  } catch (error) {
    console.error("Error activating scheduled announcements: ", error);
    throw new Error("Failed to activate announcements.");
  }
};

// Re-publish an archived announcement
export const republishAnnouncement = async (id: string, durationDays: number = 2): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore is not initialized.');
    
    const now = new Date();
    const expiryDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    
    await updateAnnouncement(id, {
      status: 'active',
      publishDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      durationDays,
    });
  } catch (error) {
    console.error("Error republishing announcement: ", error);
    throw new Error("Failed to republish announcement.");
  }
};

// Increment view count
export const incrementAnnouncementViews = async (id: string): Promise<void> => {
  try {
    if (!db) return;
    const announcementRef = doc(db, "announcements", id);
    
    // Get the current document to get current view count
    const currentDocSnap = await getDocs(query(collection(db, "announcements"), where("__name__", "==", id)));
    
    if (!currentDocSnap.empty) {
      const currentCount = currentDocSnap.docs[0].data().viewCount || 0;
      await updateDoc(announcementRef, { viewCount: currentCount + 1 });
    }
  } catch (error) {
    console.error("Error incrementing view count: ", error);
    // Don't throw - this is non-critical
  }
};

// Legacy function for backward compatibility
export const getAnnouncements = async (count: number = 5): Promise<Announcement[]> => {
  return getActiveAnnouncements(undefined, count);
};
