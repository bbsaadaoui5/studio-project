
import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  getDocs,
  query,
  where,
  writeBatch,
  Timestamp,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Book, LibraryLoan } from "@/lib/types";

const BOOKS_COLLECTION = "books";
const LOANS_COLLECTION = "loans";

export type NewBook = Omit<Book, 'id' | 'status' | 'loanedTo' | 'dueDate'>;

/**
 * Adds a new book to the library catalog.
 * @param bookData - The data for the new book.
 * @returns The ID of the newly created book.
 */
export const addBook = async (bookData: NewBook): Promise<string> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot add book.');
    const newBook = {
      ...bookData,
      status: "available" as const,
    };
    const docRef = await addDoc(collection(db, BOOKS_COLLECTION), newBook);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (error) {
    console.error("Error adding book:", error);
    throw new Error("Failed to add book.");
  }
};

/**
 * Gets all books from the library catalog.
 * @returns An array of all books.
 */
export const getBooks = async (): Promise<Book[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getBooks() returning empty list.');
      return [];
    }
    const q = query(collection(db, BOOKS_COLLECTION), orderBy("title"));
    const querySnapshot = await getDocs(q);
    const books: Book[] = [];
    querySnapshot.forEach((doc) => {
      books.push({ id: doc.id, ...doc.data() } as Book);
    });
    return books;
  } catch (error) {
    console.error("Error getting books:", error);
    throw new Error("Failed to get books.");
  }
};

/**
 * Checks out a book to a student.
 * @param bookId - The ID of the book to be loaned.
 * @param studentId - The ID of the student borrowing the book.
 * @param dueDate - The ISO string for the due date.
 * @returns The ID of the new loan record.
 */
export const checkOutBook = async (bookId: string, studentId: string, dueDate: string): Promise<string> => {
  if (!db) throw new Error('Firestore not initialized. Cannot check out book.');
  const batch = writeBatch(db);

  // 1. Update the book's status
  const bookRef = doc(db, BOOKS_COLLECTION, bookId);
  batch.update(bookRef, { 
        status: 'loaned',
        loanedTo: studentId,
        dueDate: dueDate
    });

    // 2. Create a new loan record
  const loanRef = doc(collection(db, LOANS_COLLECTION));
    const newLoan: Omit<LibraryLoan, 'id' | 'returnDate' | 'loanDate'> = {
        bookId,
        studentId,
        dueDate,
    };
    batch.set(loanRef, { ...newLoan, id: loanRef.id, loanDate: serverTimestamp() });

    try {
        await batch.commit();
        return loanRef.id;
    } catch (error) {
        console.error("Error checking out book: ", error);
        throw new Error("Failed to check out book.");
    }
}

/**
 * Checks in a book that was returned.
 * @param bookId - The ID of the book being returned.
 */
export const checkInBook = async (bookId: string): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized. Cannot check in book.');
  const bookRef = doc(db, BOOKS_COLLECTION, bookId);

  // Find the active loan for this book to update it
  const loansRef = collection(db, LOANS_COLLECTION);
  const q = query(loansRef, where("bookId", "==", bookId), where("returnDate", "==", undefined), limit(1));
    
  const batch = writeBatch(db);

    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const loanDoc = querySnapshot.docs[0];
            const loanRef = doc(db, LOANS_COLLECTION, loanDoc.id);
            batch.update(loanRef, { returnDate: serverTimestamp() });
        }

        // Update the book's status
        batch.update(bookRef, {
          status: 'available',
          loanedTo: null,
          dueDate: null
        });
    
        await batch.commit();
    } catch (error) {
        console.error("Error checking in book: ", error);
        throw new Error("Failed to check in book.");
    }
}
