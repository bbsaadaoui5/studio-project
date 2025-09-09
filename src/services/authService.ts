
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase-client";
import { getStaffMember } from "./staffService";
import { query, collection, where, getDocs } from "firebase/firestore";

/**
 * Creates a new user in Firebase Authentication.
 * @param email - The user's email.
 * @param password - The user's password.
 * @returns The new user's UID.
 */
export const createAuthUser = async (email: string, password: string):Promise<string> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user.uid;
}

export const getStaffByEmail = async (email: string) => {
    const staffRef = collection(db, "staff");
    const q = query(staffRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
        return null;
    }
    return querySnapshot.docs[0].data();
}
