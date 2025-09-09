
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
import type { InventoryItem } from "@/lib/types";

const INVENTORY_COLLECTION = "inventory";

export type NewInventoryItem = Omit<InventoryItem, "id">;

/**
 * Adds a new item to the inventory.
 * @param itemData - The data for the new inventory item.
 * @returns The ID of the newly created item.
 */
export const addInventoryItem = async (itemData: Omit<NewInventoryItem, 'status'>): Promise<string> => {
  try {
    const newItem = {
      ...itemData,
      status: "available" as const,
    };
    const docRef = await addDoc(collection(db, INVENTORY_COLLECTION), newItem);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error adding inventory item:", error);
    throw new Error("Failed to add inventory item.");
  }
};

/**
 * Gets all items from the inventory, ordered by name.
 * @returns An array of all inventory items.
 */
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const q = query(collection(db, INVENTORY_COLLECTION), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const items: InventoryItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() } as InventoryItem);
    });
    return items;
  } catch (error) {
    console.error("Error getting inventory items:", error);
    throw new Error("Failed to get inventory items.");
  }
};

/**
 * Updates the status of an inventory item.
 * @param itemId - The ID of the item to update.
 * @param status - The new status of the item.
 */
export const updateItemStatus = async (itemId: string, status: InventoryItem['status']): Promise<void> => {
    try {
        const itemRef = doc(db, INVENTORY_COLLECTION, itemId);
        await updateDoc(itemRef, { status });
    } catch (error) {
        console.error("Error updating item status:", error);
        throw new Error("Failed to update item status.");
    }
}
