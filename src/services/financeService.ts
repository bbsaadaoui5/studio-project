
import { db } from "@/lib/firebase-client";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  addDoc, 
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import type { Expense, FeeStructure, Payment } from "@/lib/types";

// --- Expenses ---

export const getExpenses = async (from?: Date, to?: Date): Promise<Expense[]> => {
  try {
    const expensesCol = collection(db, "expenses");
    let q;

    if (from && to) {
       q = query(expensesCol, 
        where("date", ">=", Timestamp.fromDate(from)),
        where("date", "<=", Timestamp.fromDate(to)),
        orderBy("date", "desc")
      );
    } else {
       q = query(expensesCol, orderBy("date", "desc"));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date?.toDate?.().toISOString() || new Date().toISOString(),
      } as Expense;
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw new Error("Could not fetch expenses.");
  }
};

export const addExpense = async (expenseData: Omit<Expense, 'id'>) => {

  try {
    const docRef = await addDoc(collection(db, "expenses"), {
      ...expenseData,
      date: serverTimestamp() // Use server timestamp
    });
     await updateDoc(docRef, { id: docRef.id });
    return { 
      id: docRef.id, 
      ...expenseData 
    } as Omit<Expense, 'date'> & { date: any };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Could not add expense.");
  }
};

export const getExpenseSummary = async (): Promise<Record<string, number>> => {
    const expenses = await getExpenses();
    return expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>);
};

// --- Fee Structures ---

export const getFeeStructures = async (): Promise<FeeStructure[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, "feeStructures"));
        const structures: FeeStructure[] = [];
        querySnapshot.forEach((doc) => {
            structures.push(doc.data() as FeeStructure);
        });
        return structures;
    } catch (error) {
        console.error("Error fetching fee structures:", error);
        throw new Error("Failed to fetch fee structures.");
    }
};

export const getFeeStructureForGrade = async (grade: string, academicYear: string): Promise<FeeStructure | null> => {
    try {
        const docId = `${grade}-${academicYear}`;
        const docRef = doc(db, "feeStructures", docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() as FeeStructure : null;
    } catch (error) {
        console.error("Error fetching fee structure:", error);
        throw new Error("Failed to fetch fee structure.");
    }
};

export const saveFeeStructure = async (structureData: FeeStructure): Promise<void> => {
  try {
    const docRef = doc(db, "feeStructures", structureData.id);
    await setDoc(docRef, structureData);
  } catch (error) {
    console.error("Error saving fee structure:", error);
    throw new Error("Failed to save fee structure.");
  }
};

export const updateFeeStructure = async (structureId: string, structureData: Partial<FeeStructure>): Promise<void> => {
  try {
    const docRef = doc(db, "feeStructures", structureId);
    await updateDoc(docRef, structureData);
  } catch (error) {
    console.error("Error updating fee structure:", error);
    throw new Error("Failed to update fee structure.");
  }
};


// --- Payments ---

export const getPaymentsForStudent = async (studentId: string): Promise<Payment[]> => {
  try {
    const q = query(collection(db, "payments"), where("studentId", "==", studentId), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const payments: Payment[] = [];
    querySnapshot.forEach((doc) => {
        payments.push(doc.data() as Payment);
    });
    return payments;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Failed to fetch payments.");
  }
};

export const recordPayment = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
  try {
    const docRef = await addDoc(collection(db, "payments"), { ...paymentData, date: serverTimestamp() });
    await updateDoc(docRef, { id: docRef.id });
    return { ...paymentData, id: docRef.id, date: new Date().toISOString() } as Payment;
  } catch (error) {
    console.error("Error recording payment:", error);
    throw new Error("Could not record payment.");
  }
};

export const updatePayment = async (paymentId: string, paymentData: Partial<Payment>): Promise<void> => {
  try {
    const docRef = doc(db, "payments", paymentId);
    await updateDoc(docRef, paymentData);
  } catch (error) {
    console.error("Error updating payment:", error);
    throw new Error("Could not update payment.");
  }
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  try {
    const docRef = doc(db, "payments", paymentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw new Error("Could not delete payment.");
  }
};


export const getIncomeSummary = async (): Promise<Record<string, number>> => {
    try {
        const querySnapshot = await getDocs(collection(db, "payments"));
        return querySnapshot.docs.reduce((acc, doc) => {
            const payment = doc.data() as Payment;
            const month = new Date(payment.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            acc[month] = (acc[month] || 0) + payment.amount;
            return acc;
        }, {} as Record<string, number>);
    } catch (error) {
         console.error("Error getting income summary:", error);
         return {};
    }
};
