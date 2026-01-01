import { db } from "@/lib/firebase-client";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Student, Payment, Payroll } from "@/lib/types";
import { getStudents } from "./studentService";
import { getFeeStructureForGrade } from "./financeService";
import { getPayrolls } from "./payrollService";
import { getSettings } from "./settingsService";
import { startOfMonth, endOfMonth } from "date-fns";

export interface StudentOutstandingReport {
  studentId: string;
  studentName: string;
  grade: string;
  totalDue: number;
  totalPaid: number;
  outstandingBalance: number;
  enrollmentDate: string;
}

export interface StaffPaymentDueReport {
  staffId: string;
  staffName: string;
  position?: string;
  department?: string;
  totalDueLastPayroll: number;
  lastPayrollPeriod?: string;
  status: "paid" | "pending";
}

/**
 * Generate a report of all students with outstanding fees.
 * Compares total due (months from enrollment to today × monthly fee) vs. total paid.
 */
export const getStudentOutstandingReport = async (): Promise<StudentOutstandingReport[]> => {
  try {
    if (!db) return [];

    const students = await getStudents();
    const settings = await getSettings();
    const today = new Date();

    const report: StudentOutstandingReport[] = [];

    for (const student of students) {
      if (student.status !== "active") continue;

      // Get fee structure for student's grade
      const feeStructure = await getFeeStructureForGrade(student.grade, settings.academicYear);
      if (!feeStructure) continue;

      // Get all payments for student
      const paymentsQuery = query(collection(db, "payments"), where("studentId", "==", student.id));
      const paymentsSnap = await getDocs(paymentsQuery);
      const totalPaid = paymentsSnap.docs.reduce((sum, doc) => sum + (doc.data().amount || 0), 0);

      // Calculate total due from enrollment to today
      const enrollmentDate = new Date(student.enrollmentDate);
      const enrollmentMonth = startOfMonth(enrollmentDate);
      const todayMonth = startOfMonth(today);

      let monthsDue = 0;
      let current = new Date(enrollmentMonth);
      while (current <= todayMonth) {
        monthsDue++;
        current.setMonth(current.getMonth() + 1);
      }

      const monthlyAmount = feeStructure.monthlyAmount;
      const totalDue = monthsDue * monthlyAmount;
      const outstanding = totalDue - totalPaid;

      if (outstanding !== 0) {
        report.push({
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          totalDue,
          totalPaid,
          outstandingBalance: outstanding,
          enrollmentDate: student.enrollmentDate,
        });
      }
    }

    // Sort by outstanding balance (descending)
    report.sort((a, b) => b.outstandingBalance - a.outstandingBalance);
    return report;
  } catch (error) {
    console.error("Error generating student outstanding report:", error);
    return [];
  }
};

/**
 * Generate a report of all staff with outstanding salary payments.
 * Aggregates payslips from generated payrolls to track who still needs payment.
 */
export const getStaffPaymentDueReport = async (): Promise<StaffPaymentDueReport[]> => {
  try {
    if (!db) return [];

    const payrolls = await getPayrolls();
    console.log("All payrolls:", payrolls.map(p => ({id: p.id, period: p.period, status: p.status})));
    
    // Filter to only include payrolls that are pending (not paid or cancelled)
    const pendingPayrolls = payrolls.filter(p => !p.status || p.status === "pending");
    console.log("Pending payrolls:", pendingPayrolls.map(p => ({id: p.id, period: p.period, status: p.status})));
    
    const report: Map<string, StaffPaymentDueReport> = new Map();

    // Process payrolls in order (most recent first)
    for (const payroll of pendingPayrolls) {
      for (const payslip of payroll.payslips) {
        if (!report.has(payslip.staffId)) {
          report.set(payslip.staffId, {
            staffId: payslip.staffId,
            staffName: payslip.staffName,
            totalDueLastPayroll: payslip.netPay,
            lastPayrollPeriod: payroll.period,
            status: (payroll.status === "paid" ? "paid" : "pending"), // Map cancelled to pending
            position: undefined,
            department: undefined,
          });
        }
      }
    }

    console.log("Staff payment due report:", Array.from(report.values()));
    return Array.from(report.values());
  } catch (error) {
    console.error("Error generating staff payment due report:", error);
    return [];
  }
};

/**
 * Get a summary dashboard with key metrics.
 */
export const getFinancialSummary = async (): Promise<{
  totalStudentOutstanding: number;
  totalStudentDue: number;
  totalStudentPaid: number;
  totalStaffPayableSalaries: number;
  studentCount: number;
  staffCount: number;
}> => {
  try {
    const studentReport = await getStudentOutstandingReport();
    const staffReport = await getStaffPaymentDueReport();

    const totalStudentOutstanding = studentReport.reduce((sum, s) => sum + s.outstandingBalance, 0);
    const totalStudentDue = studentReport.reduce((sum, s) => sum + s.totalDue, 0);
    const totalStudentPaid = studentReport.reduce((sum, s) => sum + s.totalPaid, 0);
    const totalStaffPayableSalaries = staffReport.reduce((sum, s) => sum + s.totalDueLastPayroll, 0);

    return {
      totalStudentOutstanding,
      totalStudentDue,
      totalStudentPaid,
      totalStaffPayableSalaries,
      studentCount: studentReport.length,
      staffCount: staffReport.length,
    };
  } catch (error) {
    console.error("Error calculating financial summary:", error);
    return {
      totalStudentOutstanding: 0,
      totalStudentDue: 0,
      totalStudentPaid: 0,
      totalStaffPayableSalaries: 0,
      studentCount: 0,
      staffCount: 0,
    };
  }
};
