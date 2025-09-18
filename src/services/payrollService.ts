

import { db } from "@/lib/firebase-client";
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Payroll, Payslip, Staff } from "@/lib/types";
import { getStaffMembers } from "./staffService";

const PAYROLL_COLLECTION = "payrolls";

type GeneratePayrollResult = 
  | { success: true; payroll: Payroll }
  | { success: false; reason: string };

/**
 * Generates a payroll for a given period.
 * @param period - A string representing the payroll period (e.g., "July 2024").
 * @returns A result object indicating success or failure.
 */
export const generatePayroll = async (period: string): Promise<GeneratePayrollResult> => {
  try {
    const existingPayrollQuery = query(collection(db, PAYROLL_COLLECTION), where("period", "==", period));
    const existingPayrollSnapshot = await getDocs(existingPayrollQuery);
    if (!existingPayrollSnapshot.empty) {
      return { success: false, reason: `Payroll for ${period} has already been generated.` };
    }

    const activeStaff = (await getStaffMembers()).filter(
      (s) => s.status === "active" && s.paymentType === "salary" && s.paymentRate && s.paymentRate && s.paymentRate && s.paymentRate > 0
    );

    if (activeStaff.length === 0) {
      return { success: false, reason: "No active staff members with fixed salaries were found to generate payroll." };
    }

    let totalAmount = 0;
    const payslips: Payslip[] = activeStaff.map((staff) => {
      const monthlySalary = staff.paymentRate || 0; // paymentRate is now the monthly salary
      const deductions = monthlySalary * 0.1; 
      const bonus = 0;
      const netPay = monthlySalary + bonus - deductions;
      totalAmount += netPay;

      return {
        staffId: staff.id,
        staffName: staff.name,
        salary: monthlySalary as number,
        bonus,
        deductions,
        netPay,
      };
    });

    const newPayrollData: Omit<Payroll, "id" | "runDate"> = {
      period,
      totalAmount,
      payslips,
    };

    const docRef = await addDoc(collection(db, PAYROLL_COLLECTION), { ...newPayrollData, runDate: serverTimestamp() });
    const finalPayroll = { id: docRef.id, ...newPayrollData, runDate: new Date().toISOString() };
    await updateDoc(docRef, { id: docRef.id });

    return { success: true, payroll: finalPayroll };
  } catch (error) {
    console.error("Error generating payroll:", error);
    return { success: false, reason: "An unexpected error occurred while generating payroll." };
  }
};

/**
 * Gets all saved payroll records, sorted by date.
 * @returns An array of payroll records.
 */
export const getPayrolls = async (): Promise<Payroll[]> => {
  try {
    const q = query(
      collection(db, PAYROLL_COLLECTION),
      orderBy("runDate", "desc")
    );
    const querySnapshot = await getDocs(q);
    const payrolls: Payroll[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.runDate && typeof data.runDate.toDate === 'function') {
        data.runDate = data.runDate.toDate().toISOString();
      }
      payrolls.push(data as Payroll);
    });
    return payrolls;
  } catch (error) {
    console.error("Error getting payrolls:", error);
    throw new Error("Failed to get payrolls.");
  }
};


/**
 * Gets a single payroll record by its ID.
 * @param id - The ID of the payroll record.
 * @returns The payroll object, or null if not found.
 */
export const getPayroll = async (id: string): Promise<Payroll | null> => {
    try {
        const docRef = doc(db, PAYROLL_COLLECTION, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.runDate && typeof data.runDate.toDate === 'function') {
              data.runDate = data.runDate.toDate().toISOString();
            }
            return data as Payroll;
        }
        return null;
    } catch (error) {
        console.error("Error getting payroll:", error);
        throw new Error("Failed to get payroll.");
    }
}

/**
 * Updates a payroll record in Firestore.
 * @param id - The ID of the payroll to update.
 * @param payrollData - The updated payroll data.
 */
export const updatePayroll = async (id: string, payrollData: Partial<Payroll>): Promise<void> => {
    try {
        const payrollRef = doc(db, PAYROLL_COLLECTION, id);
        await updateDoc(payrollRef, payrollData);
    } catch (error) {
        console.error("Error updating payroll:", error);
        throw new Error("Failed to update payroll.");
    }
};

/**
 * Deletes a payroll record from Firestore.
 * @param id - The ID of the payroll to delete.
 */
export const deletePayroll = async (id: string): Promise<void> => {
    try {
        const payrollRef = doc(db, PAYROLL_COLLECTION, id);
        await deleteDoc(payrollRef);
    } catch (error) {
        console.error("Error deleting payroll:", error);
        throw new Error("Failed to delete payroll.");
    }
};
