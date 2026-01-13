// تحديث مصروف
export const updateExpense = async (expenseId: string, expenseData: Partial<Expense>): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot update expense.');
    const docRef = doc(db, "expenses", expenseId);
    await updateDoc(docRef, expenseData);
  } catch (error) {
    console.error("Error updating expense:", error);
    throw new Error("Could not update expense.");
  }
}
// حذف مصروف
export const deleteExpense = async (expenseId: string): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot delete expense.');
    const docRef = doc(db, "expenses", expenseId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw new Error("Could not delete expense.");
  }
}

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
import { getCoursesForStudent } from "./enrollmentService";
import { getCourse } from "./courseService";
import { getStudent } from "./studentService";

// --- Expenses ---

export const getExpenses = async (from?: Date, to?: Date): Promise<Expense[]> => {
  try {
    if (!db) {
      console.warn('Firestore not initialized. getExpenses() returning empty list.');
      return [];
    }
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
    if (!db) throw new Error('Firestore not initialized. Cannot add expense.');
    const docRef = await addDoc(collection(db, "expenses"), {
      ...expenseData,
      date: serverTimestamp() // Use server timestamp
    });
    await updateDoc(docRef, { id: docRef.id });
    return { 
      id: docRef.id, 
      ...expenseData,
      date: new Date().toISOString(),
    } as Omit<Expense, 'date'> & { date: string };
  } catch (error) {
    console.error("Error adding expense:", error);
    throw new Error("Could not add expense.");
  }
};

export const getExpenseSummary = async (from?: Date, to?: Date): Promise<Record<string, number>> => {
  const expenses = await getExpenses(from, to);
  return expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);
};

// --- Fee Structures ---

/**
 * Sanitizes a string to be safe for use in Firestore document IDs.
 * Replaces forward slashes with underscores to avoid path segment issues.
 */
const sanitizeDocId = (str: string): string => {
  return str.replace(/\//g, '_');
};

export const getFeeStructures = async (): Promise<FeeStructure[]> => {
    try {
    if (!db) {
      console.warn('Firestore not initialized. getFeeStructures() returning empty list.');
      return [];
    }
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
        const docId = `${sanitizeDocId(grade)}-${sanitizeDocId(academicYear)}`;
    if (!db) {
      console.warn('Firestore not initialized. getFeeStructureForGrade() returning null.');
      return null;
    }
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

/**
 * Compute combined monthly due for a student: grade monthly fee + any support-course monthly fees.
 * Returns gradeMonthly, supportMonthly, combinedMonthly.
 */
export const getCombinedMonthlyDueForStudent = async (studentId: string, academicYear: string): Promise<{ gradeMonthly: number; supportMonthly: number; combinedMonthly: number }> => {
  try {
    const student = await getStudent(studentId);
    if (!student) return { gradeMonthly: 0, supportMonthly: 0, combinedMonthly: 0 };

    // Grade-based monthly fee
    let gradeMonthly = 0;
    if (student.grade && student.grade !== 'N/A') {
      const fs = await getFeeStructureForGrade(student.grade, academicYear);
      gradeMonthly = fs?.monthlyAmount || 0;
    }

    // Support courses monthly sum
    let supportMonthly = 0;
    const courseIds = await getCoursesForStudent(studentId);
    for (const cid of courseIds) {
      try {
        const course = await getCourse(cid);
        if (course && course.type === 'support') {
          supportMonthly += Number((course as any).monthlyFee || 0);
        }
      } catch (err) {
        // ignore individual course errors
        console.warn('Failed to load course for fee aggregation', cid, err);
      }
    }

    const combinedMonthly = gradeMonthly + supportMonthly;
    return { gradeMonthly, supportMonthly, combinedMonthly };
  } catch (err) {
    console.error('Error computing combined monthly due:', err);
    return { gradeMonthly: 0, supportMonthly: 0, combinedMonthly: 0 };
  }
}

export const saveFeeStructure = async (structureData: FeeStructure): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot save fee structure.');
    const docRef = doc(db, "feeStructures", structureData.id);
    await setDoc(docRef, structureData);
  } catch (error) {
    console.error("Error saving fee structure:", error);
    throw new Error("Failed to save fee structure.");
  }
};

export const updateFeeStructure = async (structureId: string, structureData: Partial<FeeStructure>): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot update fee structure.');
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
    if (!db) {
      console.warn('Firestore not initialized. getPaymentsForStudent() returning empty list.');
      return [];
    }
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

export const recordPayment = async (paymentData: Omit<Payment, 'id'> & { stripePaymentId?: string }): Promise<Payment> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot record payment.');
    const docRef = await addDoc(collection(db, "payments"), { ...paymentData, date: serverTimestamp(), stripePaymentId: paymentData.stripePaymentId || null });
    await updateDoc(docRef, { id: docRef.id });
    return { ...paymentData, id: docRef.id, date: new Date().toISOString() } as Payment;
  } catch (error) {
    console.error("Error recording payment:", error);
    throw new Error("Could not record payment.");
  }
};

export const updatePayment = async (paymentId: string, paymentData: Partial<Payment>): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot update payment.');
    const docRef = doc(db, "payments", paymentId);
    await updateDoc(docRef, paymentData);
  } catch (error) {
    console.error("Error updating payment:", error);
    throw new Error("Could not update payment.");
  }
};

export const deletePayment = async (paymentId: string): Promise<void> => {
  try {
    if (!db) throw new Error('Firestore not initialized. Cannot delete payment.');
    const docRef = doc(db, "payments", paymentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting payment:", error);
    throw new Error("Could not delete payment.");
  }
};


export const getIncomeSummary = async (from?: Date, to?: Date): Promise<Record<string, number>> => {
    try {
    if (!db) {
      console.warn('Firestore not initialized. getIncomeSummary() returning empty summary.');
      return {};
    }

    const paymentsCol = collection(db, "payments");
    const paymentsQuery = from && to
      ? query(
          paymentsCol,
          where("date", ">=", Timestamp.fromDate(from)),
          where("date", "<=", Timestamp.fromDate(to))
        )
      : paymentsCol;

    const querySnapshot = await getDocs(paymentsQuery);
    return querySnapshot.docs.reduce((acc, doc) => {
            const payment = doc.data() as Payment;
            const paymentDate = (payment.date as any)?.toDate ? (payment.date as any).toDate() : new Date(payment.date);
            const month = paymentDate.toLocaleString('en-US', { month: 'long' });
            acc[month] = (acc[month] || 0) + payment.amount;
            return acc;
        }, {} as Record<string, number>);
    } catch (error) {
         console.error("Error getting income summary:", error);
         return {};
    }
};

export const getSalaryExpenses = async (from?: Date, to?: Date): Promise<Record<string, number>> => {
    try {
        const payrolls = await getPayrolls();
    const filtered = payrolls.filter(payroll => {
      const runDate = new Date(payroll.runDate);
      if (Number.isNaN(runDate.getTime())) return false;
      if (from && runDate < from) return false;
      if (to && runDate > to) return false;
      return true;
    });

    return filtered.reduce((acc, payroll) => {
      const month = new Date(payroll.runDate).toLocaleString('en-US', { month: 'long' });
            acc[month] = (acc[month] || 0) + payroll.totalAmount;
            return acc;
        }, {} as Record<string, number>);
    } catch (error) {
        console.error("Error getting salary expenses:", error);
        return {};
    }
};

export const getExpenseSummaryWithSalaries = async (from?: Date, to?: Date): Promise<Record<string, number>> => {
    try {
        const [regularExpenses, salaryExpenses] = await Promise.all([
      getExpenseSummary(from, to),
      getSalaryExpenses(from, to)
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
