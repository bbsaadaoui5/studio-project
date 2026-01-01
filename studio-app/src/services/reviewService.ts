
import { db } from "@/lib/firebase-client";
import { collection, addDoc, getDocs, query, where, orderBy, doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { StaffReview } from "@/lib/types";

const REVIEWS_COLLECTION = "staffReviews";

export type NewStaffReview = Omit<StaffReview, 'id'>;

/**
 * Adds a new staff review to the database.
 * @param reviewData - The data for the new review.
 * @returns The ID of the newly created review document.
 */
export const addStaffReview = async (reviewData: NewStaffReview): Promise<string> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot add staff review.');
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), { ...reviewData, reviewDate: serverTimestamp() });
    await setDoc(docRef, { id: docRef.id }, { merge: true });
    return docRef.id;
  } catch (error) {
    console.error("Error adding staff review:", error);
    throw new Error("Failed to add staff review.");
  }
};

/**
 * Gets all reviews for a specific staff member.
 * @param staffId - The ID of the staff member.
 * @returns An array of staff review objects, sorted by date.
 */
export const getReviewsForStaff = async (staffId: string): Promise<StaffReview[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getReviewsForStaff() returning empty list.');
      return [];
    }
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where("staffId", "==", staffId)
    );
    const querySnapshot = await getDocs(q);
    const reviews: StaffReview[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.reviewDate && typeof data.reviewDate.toDate === 'function') {
        data.reviewDate = data.reviewDate.toDate().toISOString();
      }
      reviews.push(data as StaffReview);
    });
    
    // Sort reviews by date in descending order in the code
    reviews.sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());

    return reviews;
  } catch (error) {
    console.error("Error getting staff reviews:", error);
    throw new Error("Failed to get staff reviews.");
  }
};
