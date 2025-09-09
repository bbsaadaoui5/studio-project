
import { db } from "@/lib/firebase-client";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  address?: string;
}

const SETTINGS_COLLECTION = "settings";
const GENERAL_SETTINGS_DOC_ID = "general";

/**
 * Retrieves the general school settings from Firestore.
 * @returns The school settings object, or a default object if none are found.
 */
export const getSettings = async (): Promise<SchoolSettings> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as SchoolSettings;
    } else {
      // Return default settings if none are found
      return {
        schoolName: "CampusConnect Academy",
        academicYear: "2024-2025",
        address: "",
      };
    }
  } catch (error) {
    console.error("Error getting settings:", error);
    throw new Error("Failed to get school settings.");
  }
};

/**
 * Saves the general school settings to Firestore.
 * @param settings - The settings object to save.
 */
export const saveSettings = async (settings: SchoolSettings): Promise<void> => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, GENERAL_SETTINGS_DOC_ID);
    await setDoc(docRef, settings);
  } catch (error) {
    console.error("Error saving settings:", error);
    throw new Error("Failed to save school settings.");
  }
};
