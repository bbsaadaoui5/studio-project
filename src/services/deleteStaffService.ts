import { db } from "@/lib/firebase-client";
import { doc, deleteDoc } from "firebase/firestore";

export const deleteStaffMember = async (id: string): Promise<void> => {
  try {
    const staffRef = doc(db, "staff", id);
    await deleteDoc(staffRef);
  } catch (error) {
    console.error("Error deleting staff member: ", error);
    throw new Error("Failed to delete staff member.");
  }
};
