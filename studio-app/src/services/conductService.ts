import { db } from "@/lib/firebase-client";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";

const CONDUCT_COLLECTION = "conduct";

export interface ConductNote {
  id?: string;
  studentId: string;
  teacherId: string;
  teacherName: string;
  date: string; // ISO Date String
  note: string; // ملاحظة السلوك
  type: "positive" | "negative" | "neutral"; // نوع الملاحظة
  rating?: number; // 1-5 rating
  createdAt?: string;
}

export interface ConductSummary {
  studentId: string;
  overallRating: string; // "ممتاز" | "جيد" | "متوسط" | "ضعيف"
  totalNotes: number;
  positiveCount: number;
  negativeCount: number;
  lastUpdated: string;
}

/**
 * أضف ملاحظة سلوك جديدة للطالب
 */
export const addConductNote = async (
  conductData: Omit<ConductNote, "id" | "createdAt">
): Promise<string> => {
  try {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await addDoc(collection(db, CONDUCT_COLLECTION), {
      ...conductData,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding conduct note:", error);
    throw new Error("Failed to add conduct note");
  }
};

/**
 * احصل على جميع ملاحظات السلوك لطالب معين
 */
export const getConductNotesForStudent = async (
  studentId: string
): Promise<ConductNote[]> => {
  try {
    if (!db) return [];
    const q = query(
      collection(db, CONDUCT_COLLECTION),
      where("studentId", "==", studentId),
      orderBy("date", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as ConductNote));
  } catch (error) {
    console.error("Error fetching conduct notes:", error);
    return [];
  }
};

/**
 * احسب ملخص السلوك الشامل للطالب
 */
export const calculateConductSummary = async (
  studentId: string
): Promise<ConductSummary> => {
  try {
    const notes = await getConductNotesForStudent(studentId);

    const positiveCount = notes.filter((n) => n.type === "positive").length;
    const negativeCount = notes.filter((n) => n.type === "negative").length;
    const totalNotes = notes.length;

    // حساب التقييم الكلي
    let overallRating = "متوسط";
    if (totalNotes > 0) {
      const positiveRatio = positiveCount / totalNotes;
      if (positiveRatio >= 0.8) {
        overallRating = "ممتاز";
      } else if (positiveRatio >= 0.6) {
        overallRating = "جيد";
      } else if (positiveRatio >= 0.4) {
        overallRating = "متوسط";
      } else {
        overallRating = "ضعيف";
      }
    }

    return {
      studentId,
      overallRating,
      totalNotes,
      positiveCount,
      negativeCount,
      lastUpdated: notes.length > 0 ? notes[0].date : new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error calculating conduct summary:", error);
    return {
      studentId,
      overallRating: "متوسط",
      totalNotes: 0,
      positiveCount: 0,
      negativeCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
};

/**
 * احصل على آخر ملاحظات السلوك (آخر 5)
 */
export const getRecentConductNotes = async (
  studentId: string,
  limit: number = 5
): Promise<ConductNote[]> => {
  try {
    const notes = await getConductNotesForStudent(studentId);
    return notes.slice(0, limit);
  } catch (error) {
    console.error("Error fetching recent conduct notes:", error);
    return [];
  }
};
