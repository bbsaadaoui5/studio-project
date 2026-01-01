

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
import type { Payroll, Payslip, Staff, PayslipItem } from "@/lib/types";
import { getStaffMembers } from "./staffService";
import {
  generateDefaultPayslipItems,
  recalculateDeductions,
  calculateEmployerAMO,
  calculateEmployerCNSS,
  calculateProratedBase,
} from "@/lib/moroccan-payroll";
import { payrollSchema } from "@/lib/validation";
import { logAudit, getBrowserInfo } from "@/lib/audit";
import { checkRateLimit, RateLimits } from "@/lib/rate-limit";

const PAYROLL_COLLECTION = "payrolls";

type GeneratePayrollResult = 
  | { success: true; payroll: Payroll }
  | { success: false; reason: string };

const sumAmount = (items: PayslipItem[]) => items.reduce((sum, item) => sum + (item.amount || 0), 0);

/**
 * Normalize legacy payslip structure into the new earnings/deductions layout.
 */
const normalizePayslip = (p: any): Payslip => {
  // Legacy fields
  const baseSalary = p.baseSalary ?? p.salary ?? 0;
  const bonus = p.bonus ?? 0;
  const legacyDeductions = p.deductions ?? 0;

  let earnings: PayslipItem[] = p.earnings || [];
  let deductions: PayslipItem[] = p.deductions || [];

  if (!p.earnings) {
    earnings = [
      { id: "base-salary", label: "Salaire de base", amount: baseSalary, type: "earning", category: "base", taxable: true },
    ];
    if (bonus > 0) {
      earnings.push({ id: "bonus", label: "Prime", amount: bonus, type: "earning", category: "bonus", taxable: true });
    }
  }

  if (!p.deductions) {
    deductions = legacyDeductions > 0
      ? [{ id: "legacy-deduction", label: "Retenues", amount: legacyDeductions, type: "deduction", category: "custom" }]
      : [];
  }

  const grossSalary = sumAmount(earnings);
  const totalDeductions = sumAmount(deductions);
  const netPay = p.netPay ?? grossSalary - totalDeductions;

  return {
    staffId: p.staffId,
    staffName: p.staffName,
    staffPosition: p.staffPosition,
    cnssNumber: p.cnssNumber,
    cin: p.cin,
    period: p.period || "",
    paymentDate: p.paymentDate,
    baseSalary,
    earnings,
    deductions,
    grossSalary,
    totalDeductions,
    netPay,
    employerCNSS: p.employerCNSS,
    employerAMO: p.employerAMO,
  };
};

/**
 * Generates a payroll for a given period.
 * @param period - A string representing the payroll period (e.g., "July 2024").
 * @returns A result object indicating success or failure.
 */
export const generatePayroll = async (period: string, userId?: string): Promise<GeneratePayrollResult> => {
  try {
  // Rate limiting
  const rateLimitKey = `payroll:generate:${userId || 'anonymous'}`;
  const rateLimit = checkRateLimit(rateLimitKey, RateLimits.PAYROLL_GENERATION);
  if (!rateLimit.allowed) {
    await logAudit({
      action: 'payroll.generate',
      userId,
      status: 'failure',
      errorMessage: 'Rate limit exceeded',
      details: { period, blockedUntil: rateLimit.blockedUntil },
      ...getBrowserInfo(),
    });
    return { success: false, reason: `Rate limit exceeded. Try again after ${rateLimit.blockedUntil?.toLocaleTimeString() || 'some time'}.` };
  }

  if (!db) return { success: false, reason: 'Firestore not initialized. Cannot generate payroll.' };
  const existingPayrollQuery = query(collection(db, PAYROLL_COLLECTION), where("period", "==", period));
  const existingPayrollSnapshot = await getDocs(existingPayrollQuery);
    if (!existingPayrollSnapshot.empty) {
      return { success: false, reason: `Payroll for ${period} has already been generated.` };
    }

    const activeStaff = (await getStaffMembers()).filter(
      (s) => s.status === "active" && s.paymentType === "salary" && s.paymentRate && s.paymentRate > 0
    );

    if (activeStaff.length === 0) {
      return { success: false, reason: "No active staff members with fixed salaries were found to generate payroll." };
    }

    let totalAmount = 0;
    const payslips: Payslip[] = activeStaff.map((staff) => {
      const baseSalary = staff.paymentRate || staff.salary || 0;
      // Prorate base salary for hires within the period (calendar-days method)
      const { proratedBase, daysWorked, totalDays } = calculateProratedBase(baseSalary, staff.hireDate, period);
      const usedBase = proratedBase;
      const { earnings: defaultEarnings, deductions: defaultDeductions } = generateDefaultPayslipItems(usedBase);
      // If prorated, clarify on base salary line item label
      if (usedBase !== baseSalary) {
        const idx = defaultEarnings.findIndex(e => e.id === "base-salary");
        if (idx >= 0) {
          defaultEarnings[idx] = {
            ...defaultEarnings[idx],
            label: `${defaultEarnings[idx].label} (Prorated ${daysWorked}/${totalDays})`,
          };
        }
      }
      const grossSalary = sumAmount(defaultEarnings);
      const totalDeductions = sumAmount(defaultDeductions);
      const netPay = grossSalary - totalDeductions;
      totalAmount += netPay;

      // Build payslip object, excluding undefined fields
      const payslip: any = {
        staffId: staff.id,
        staffName: staff.name,
        period,
        baseSalary: usedBase,
        earnings: defaultEarnings,
        deductions: defaultDeductions,
        grossSalary,
        totalDeductions,
        netPay,
        employerCNSS: calculateEmployerCNSS(grossSalary),
        employerAMO: calculateEmployerAMO(grossSalary),
      };

      // Add optional fields only if they exist
      if (staff.position) payslip.staffPosition = staff.position;
      if (staff.cnssNumber) payslip.cnssNumber = staff.cnssNumber;
      if (staff.cin) payslip.cin = staff.cin;

      return payslip as Payslip;
    });

    const newPayrollData: Omit<Payroll, "id" | "runDate"> = {
      period,
      totalAmount,
      payslips,
      status: "pending", // Default to pending payment
    };

  // Validate payroll data
    try {
      payrollSchema.parse(newPayrollData);
    } catch (validationError: any) {
      await logAudit({
        action: 'payroll.generate',
        userId,
        status: 'failure',
        errorMessage: 'Validation failed',
        details: { period, errors: validationError.errors },
        ...getBrowserInfo(),
      });
      return { success: false, reason: 'Invalid payroll data: ' + validationError.message };
    }

  if (!db) return { success: false, reason: 'Firestore not initialized. Cannot generate payroll.' };
  const docRef = await addDoc(collection(db, PAYROLL_COLLECTION), { ...newPayrollData, runDate: serverTimestamp() });
    const finalPayroll = { id: docRef.id, ...newPayrollData, runDate: new Date().toISOString(), status: "pending" as const };
    await updateDoc(docRef, { id: docRef.id });

    // Audit log success
    await logAudit({
      action: 'payroll.generate',
      userId,
      resourceId: docRef.id,
      resourceType: 'payroll',
      status: 'success',
      details: { period, totalAmount, staffCount: payslips.length },
      ...getBrowserInfo(),
    });

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
    if (!db) {
      console.warn('Firestore not initialized. getPayrolls() returning empty list.');
      return [];
    }
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
      const normalizedPayslips = (data.payslips || []).map(normalizePayslip);
      payrolls.push({ ...(data as Payroll), payslips: normalizedPayslips });
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
    if (!db) {
      console.warn('Firestore not initialized. getPayroll() returning null.');
      return null;
    }
    const docRef = doc(db, PAYROLL_COLLECTION, id);
    const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.runDate && typeof data.runDate.toDate === 'function') {
              data.runDate = data.runDate.toDate().toISOString();
            }
            const normalizedPayslips = (data.payslips || []).map(normalizePayslip);
            return { ...(data as Payroll), payslips: normalizedPayslips };
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
export const updatePayroll = async (id: string, payrollData: Partial<Payroll>, userId?: string): Promise<{success: boolean, reason?: string}> => {
    try {
    if (!db) return { success: false, reason: 'Firestore not initialized. Cannot update payroll.' };
    const payrollRef = doc(db, PAYROLL_COLLECTION, id);
    await updateDoc(payrollRef, payrollData);
    
    // Audit log
    const action = payrollData.status === 'paid' ? 'payroll.confirm' : 'payroll.edit';
    await logAudit({
      action,
      userId,
      resourceId: id,
      resourceType: 'payroll',
      status: 'success',
      details: { updates: payrollData },
      ...getBrowserInfo(),
    });
    
    return { success: true };
    } catch (error) {
        console.error("Error updating payroll:", error);
        await logAudit({
          action: 'payroll.edit',
          userId,
          resourceId: id,
          resourceType: 'payroll',
          status: 'failure',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          ...getBrowserInfo(),
        });
        return { success: false, reason: "Failed to update payroll." };
    }
};

/**
 * Deletes a payroll record from Firestore.
 * @param id - The ID of the payroll to delete.
 */
export const deletePayroll = async (id: string): Promise<void> => {
    try {
    if (!db) throw new Error('Firestore not initialized. Cannot delete payroll.');
    const payrollRef = doc(db, PAYROLL_COLLECTION, id);
    await deleteDoc(payrollRef);
    } catch (error) {
        console.error("Error deleting payroll:", error);
        throw new Error("Failed to delete payroll.");
    }
};
