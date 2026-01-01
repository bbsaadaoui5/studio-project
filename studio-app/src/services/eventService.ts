
import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";
import type { SchoolEvent } from "@/lib/types";

const EVENTS_COLLECTION = "events";

export type NewSchoolEvent = Omit<SchoolEvent, "id">;

/**
 * Adds a new event to the calendar.
 * @param eventData - The data for the new event.
 * @returns The ID of the newly created event.
 */
export const addEvent = async (eventData: NewSchoolEvent): Promise<string> => {
  try {
    if (!db) throw new Error('Firestore is not initialized. Cannot add event.');
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), eventData);
    // Ensure the document ID is stored within the document itself
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error adding event:", error);
    throw new Error("Failed to add event.");
  }
};

/**
 * Gets all scheduled events, ordered by date.
 * @returns An array of all events.
 */
export const getEvents = async (): Promise<SchoolEvent[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getEvents() returning empty list.');
      return [];
    }
    const q = query(collection(db, EVENTS_COLLECTION), orderBy("date", "asc"));
    const querySnapshot = await getDocs(q);
    const events: SchoolEvent[] = [];
    querySnapshot.forEach((doc) => {
      events.push(doc.data() as SchoolEvent);
    });
    return events;
  } catch (error) {
    console.error("Error getting events:", error);
    throw new Error("Failed to get events.");
  }
};
