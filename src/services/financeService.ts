
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
import type { Expense, FeeStructure, Payment, Payroll } from "@/lib/types";
import { getPayrolls } from "./payrollService";

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
        // First try exact match
        const docId = `${grade}-${academicYear}`;
        const docRef = doc(db, "feeStructures", docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as FeeStructure;
        }
        
        // If not found, try case-insensitive search through all structures
        const allStructures = await getFeeStructures();
        const normalizedGrade = grade.toLowerCase();
        
        return allStructures.find(structure => 
            structure.grade.toLowerCase() === normalizedGrade && 
            structure.academicYear === academicYear
        ) || null;
        
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
    const q = query(collection(db, "payments"), where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    const payments: Payment[] = [];
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        payments.push({
          ...data,
          date: data.date?.toDate?.().toISOString() || data.date
        } as Payment);
    });
    // Sort in JavaScript instead of Firestore
    return payments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
            const month = new Date(payment.date).toLocaleString('default', { month: 'long' });
            acc[month] = (acc[month] || 0) + payment.amount;
            return acc;
        }, {} as Record<string, number>);
    } catch (error) {
         console.error("Error getting income summary:", error);
         return {};
    }
};

export const getSalaryExpenses = async (): Promise<Record<string, number>> => {
    try {
        const payrolls = await getPayrolls();
        return payrolls.reduce((acc, payroll) => {
            const month = new Date(payroll.runDate).toLocaleString('default', { month: 'long' });
            acc[month] = (acc[month] || 0) + payroll.totalAmount;
            return acc;
        }, {} as Record<string, number>);
    } catch (error) {
        console.error("Error getting salary expenses:", error);
        return {};
    }
};

export const getExpenseSummaryWithSalaries = async (): Promise<Record<string, number>> => {
    try {
        const [regularExpenses, salaryExpenses] = await Promise.all([
            getExpenseSummary(),
            getSalaryExpenses()
        ]);
        
        const totalSalaries = Object.values(salaryExpenses).reduce((sum, amount) => sum + amount, 0);
        
        return {
            ...regularExpenses,
            "Staff Salaries": totalSalaries
        };
    } catch (error) {
        console.error("Error getting expense summary with salaries:", error);
        return {};
    }
};
