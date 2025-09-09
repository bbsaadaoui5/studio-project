
import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  updateDoc,
} from "firebase/firestore";

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
}

export type NewRole = Omit<Role, "id" | "userCount">;

const ROLES_COLLECTION = "roles";

/**
 * Adds a new role to the database.
 * @param roleData - The data for the new role.
 * @returns The ID of the newly created role.
 */
export const addRole = async (roleData: NewRole): Promise<string> => {
  try {
    const newRole = {
      ...roleData,
      userCount: 0, // New roles start with 0 users
    };
    const docRef = await addDoc(collection(db, ROLES_COLLECTION), newRole);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error adding role:", error);
    throw new Error("Failed to add new role.");
  }
};

/**
 * Gets all roles from the database.
 * @returns An array of all role objects.
 */
export const getRoles = async (): Promise<Role[]> => {
  try {
    const q = query(collection(db, ROLES_COLLECTION), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const roles: Role[] = [];
    querySnapshot.forEach((doc) => {
      roles.push(doc.data() as Role);
    });
    return roles;
  } catch (error) {
    console.error("Error getting roles:", error);
    throw new Error("Failed to get roles.");
  }
};
