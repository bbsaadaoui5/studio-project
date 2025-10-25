

import { db } from "@/lib/firebase-client";
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, setDoc, writeBatch, query, where, runTransaction, getCountFromServer, serverTimestamp, limit } from "firebase/firestore";
import type { Staff } from "@/lib/types";
import { isDevMockEnabled, getMockStaffMembers, getMockStaffMember } from "@/lib/dev-mock";
import { createAuthUser } from "./authService";
import { assignTeacherToCourses } from "./courseService";

// Type for a new staff member, omitting the 'id'
export type NewStaff = Omit<Staff, 'id'> & { password?: string };
export type UpdatableStaff = Omit<Staff, 'id' | 'hireDate'>;

const getNextStaffId = async (): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized. Cannot generate staff ID.');
  const counterRef = doc(db, "counters", "staffId");

  return runTransaction(db, async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let nextId = 1001;
    if (counterDoc.exists()) {
      nextId = counterDoc.data().currentId + 1;
    }
    transaction.set(counterRef, { currentId: nextId }, { merge: true });
    return `STAFF${nextId}`;
  });
};

// Function to add a new staff member to Firestore and create an auth user if needed
export const addStaffMember = async (staffData: Omit<NewStaff, 'id' | 'status' | 'hireDate' | 'idNumber'> & { courseIds?: string[] }): Promise<string> => {
  if (!db) throw new Error('Firestore is not initialized. Cannot add staff member.');
  const { email, password, role, courseIds, ...restOfStaffData } = staffData;
  let authUid = '';
  const staffId = await getNextStaffId();

  // Case 1: Role requires a login (teacher or admin)
  if (role === 'teacher' || role === 'admin') {
    if (!email || !password) {
      throw new Error("Email and password are required for teachers and admins.");
    }
    // Check if a staff member with this email already exists in the database
    const staffQuery = query(collection(db, "staff"), where("email", "==", email));
    const querySnapshot = await getDocs(staffQuery);
    if (!querySnapshot.empty) {
      throw new Error("A staff member with this email already exists in the directory.");
    }
    try {
      authUid = await createAuthUser(email, password);
    } catch (error: unknown) {
      const e = error as { code?: string };
      if (e.code === 'auth/email-already-in-use') {
        throw new Error("This email is already registered for a login account.");
      }
      console.error("Error creating auth user:", error);
      throw new Error("Could not create the user's login account.");
    }
  }

  // Use the new UID as the doc ID for teachers/admins, or generate a new ID for support staff
  const newDocRef = authUid ? doc(db, "staff", authUid) : doc(collection(db, "staff"));

  const newStaffData = {
    ...restOfStaffData,
    idNumber: staffId,
    email: email || '', // Ensure email is not undefined
    role,
    status: "active" as const,
    hireDate: serverTimestamp(),
    paymentType: staffData.paymentType,
    paymentRate: staffData.paymentRate,
  };

  try {
    await setDoc(newDocRef, { ...newStaffData, id: newDocRef.id });
    
    // Assign teacher to courses if courseIds provided and role is teacher
    if (role === "teacher" && courseIds && courseIds.length > 0) {
      await assignTeacherToCourses(newDocRef.id, restOfStaffData.name, courseIds);
    }
    
    return newDocRef.id;
  } catch (error) {
    console.error("CRITICAL: Auth user created but Firestore staff document failed for teachers/admins.", error);
    throw new Error("Failed to add staff member record.");
  }
};


// Function to get all staff members from Firestore
export const getStaffMembers = async (): Promise<Staff[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getStaffMembers() returning empty list.');
  if (isDevMockEnabled()) return getMockStaffMembers();
      return [];
    }
    const staffQuery = query(collection(db, "staff"), limit(50));
    const querySnapshot = await getDocs(staffQuery);
    const staff: Staff[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to ISO string
      if (data.hireDate && typeof data.hireDate.toDate === 'function') {
        data.hireDate = data.hireDate.toDate().toISOString();
      }
      staff.push({ id: doc.id, ...data } as Staff);
    });
    return staff;
  } catch (error) {
    console.error("Error getting staff members: ", error);
    throw new Error("Failed to get staff members.");
  }
};

// Function to get a single staff member by ID from Firestore
export const getStaffMember = async (id: string): Promise<Staff | null> => {
    try {
    if (!db) {
      console.warn('Firestore not initialized. getStaffMember() returning null.');
  if (isDevMockEnabled()) return getMockStaffMember(id);
      return null;
    }
    const docRef = doc(db, "staff", id);
    const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamp to ISO string
            if (data.hireDate && typeof data.hireDate.toDate === 'function') {
                data.hireDate = data.hireDate.toDate().toISOString();
            }
            return { id: docSnap.id, ...data } as Staff;
        } else {
            console.log("No such staff member document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting staff member:", error);
        throw new Error("Failed to get staff member.");
    }
}

// Function to update a staff member in Firestore
export const updateStaffMember = async (id: string, staffData: Partial<UpdatableStaff>): Promise<void> => {
    try {
    if (!db) throw new Error('Firestore is not initialized. Cannot update staff member.');
    const staffRef = doc(db, "staff", id);
    await updateDoc(staffRef, staffData);
    } catch (error) {
        console.error("Error updating staff member: ", error);
        throw new Error("Failed to update staff member.");
    }
}

// Optimized function to get active staff count
export const getStaffCount = async (): Promise<number> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getStaffCount() returning 0.');
  if (isDevMockEnabled()) return (await getMockStaffMembers()).length;
      return 0;
    }
    const q = query(collection(db, "staff"), where("status", "==", "active"));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
  } catch (error) {
    console.error("Error getting staff count:", error);
    throw new Error("Failed to get staff count.");
  }
};
