/**
 * خدمة المستحقات المالية
 * تتبع رسوم الطلاب المستحقة (أول الشهر) ورواتب الموظفين (آخر الشهر)
 */

import { db } from "@/lib/firebase-client";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import type { Student, Payroll } from "@/lib/types";
import { getStudents } from "./studentService";
import { getPaymentsForStudent } from "./financeService";
import { getPayrolls } from "./payrollService";

export interface StudentDuePayment {
  studentId: string;
  studentName: string;
  grade: string;
  className: string;
  monthlyFee: number;
  month: string;
  year: number;
  dueDate: string; // أول الشهر
  status: 'paid' | 'pending' | 'overdue'; // مدفوع، معلق، متأخر
  lastPaymentDate?: string;
  amountPaid?: number;
}

export interface StaffDuePayment {
  staffId: string;
  staffName: string;
  position: string;
  salary: number;
  month: string;
  year: number;
  dueDate: string; // آخر الشهر
  status: 'paid' | 'pending' | 'overdue';
  paymentDate?: string;
}

/**
 * احسب المستحقات من الطلاب لشهر معين
 */
export const getStudentsDuePayments = async (year: number, month: number): Promise<StudentDuePayment[]> => {
  try {
    const students = await getStudents();
    const activeStudents = students.filter(s => s.status === 'active');
    
    const duePayments: StudentDuePayment[] = [];
    const dueDate = new Date(year, month - 1, 1).toISOString(); // أول الشهر

    for (const student of activeStudents) {
      // احصل على رسوم الطالب الشهرية
      const monthlyFee = student.monthlyFee || 0;
      if (monthlyFee === 0) continue;

      // تحقق من الدفع في هذا الشهر
      const payments = await getPaymentsForStudent(student.id);
      const monthPayments = payments.filter(p => {
        const payDate = new Date(p.date);
        return payDate.getFullYear() === year && payDate.getMonth() === month - 1;
      });

      const totalPaid = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const lastPayment = monthPayments.length > 0 ? monthPayments[0] : null;

      const today = new Date();
      const dueDateObj = new Date(year, month - 1, 1);
      const isOverdue = today > dueDateObj && totalPaid < monthlyFee;

      duePayments.push({
        studentId: student.id,
        studentName: student.name,
        grade: student.grade || '',
        className: student.className || '',
        monthlyFee,
        month: new Date(year, month - 1).toLocaleString('ar-SA', { month: 'long' }),
        year,
        dueDate,
        status: totalPaid >= monthlyFee ? 'paid' : isOverdue ? 'overdue' : 'pending',
        lastPaymentDate: lastPayment?.date,
        amountPaid: totalPaid > 0 ? totalPaid : undefined
      });
    }

    return duePayments;
  } catch (error) {
    console.error("Error fetching student due payments:", error);
    return [];
  }
};

/**
 * احسب المستحقات من الموظفين لشهر معين
 */
export const getStaffDuePayments = async (year: number, month: number): Promise<StaffDuePayment[]> => {
  try {
    const payrolls = await getPayrolls();
    const monthPayrolls = payrolls.filter(p => {
      const runDate = new Date(p.runDate);
      return runDate.getFullYear() === year && runDate.getMonth() === month - 1;
    });

    const today = new Date();
    const lastDayOfMonth = new Date(year, month, 0);
    const isOverdue = today > lastDayOfMonth;

    return monthPayrolls.map(payroll => ({
      staffId: payroll.staffId,
      staffName: payroll.staffName || 'Unknown',
      position: payroll.position || '',
      salary: payroll.totalAmount,
      month: new Date(year, month - 1).toLocaleString('ar-SA', { month: 'long' }),
      year,
      dueDate: new Date(year, month, 0).toISOString(), // آخر الشهر
      status: payroll.isPaid ? 'paid' : isOverdue ? 'overdue' : 'pending',
      paymentDate: payroll.paymentDate
    }));
  } catch (error) {
    console.error("Error fetching staff due payments:", error);
    return [];
  }
};

/**
 * احسب ملخص المستحقات الشهرية
 */
export const getDueSummary = async (year: number, month: number) => {
  try {
    const [studentsDue, staffDue] = await Promise.all([
      getStudentsDuePayments(year, month),
      getStaffDuePayments(year, month)
    ]);

    const studentStats = {
      total: studentsDue.length,
      paid: studentsDue.filter(s => s.status === 'paid').length,
      pending: studentsDue.filter(s => s.status === 'pending').length,
      overdue: studentsDue.filter(s => s.status === 'overdue').length,
      totalAmount: studentsDue.reduce((sum, s) => sum + s.monthlyFee, 0),
      totalCollected: studentsDue.reduce((sum, s) => sum + (s.amountPaid || 0), 0)
    };

    const staffStats = {
      total: staffDue.length,
      paid: staffDue.filter(s => s.status === 'paid').length,
      pending: staffDue.filter(s => s.status === 'pending').length,
      overdue: staffDue.filter(s => s.status === 'overdue').length,
      totalAmount: staffDue.reduce((sum, s) => sum + s.salary, 0)
    };

    return {
      year,
      month,
      students: studentStats,
      staff: staffStats,
      studentDetails: studentsDue,
      staffDetails: staffDue
    };
  } catch (error) {
    console.error("Error getting due summary:", error);
    throw new Error("Failed to get due summary");
  }
};

/**
 * احصل على المستحقات المتأخرة (متأخر الدفع)
 */
export const getOverduePayments = async () => {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // تحقق من الأشهر السابقة والشهر الحالي
    const overdueStudents: StudentDuePayment[] = [];
    const overdueStaff: StaffDuePayment[] = [];

    for (let i = 0; i < 3; i++) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      const students = await getStudentsDuePayments(year, month);
      const staff = await getStaffDuePayments(year, month);

      overdueStudents.push(...students.filter(s => s.status === 'overdue'));
      overdueStaff.push(...staff.filter(s => s.status === 'overdue'));
    }

    return {
      overdueStudents,
      overdueStaff,
      totalOverdueStudentAmount: overdueStudents.reduce((sum, s) => sum + (s.monthlyFee - (s.amountPaid || 0)), 0),
      totalOverdueStaffAmount: overdueStaff.reduce((sum, s) => sum + s.salary, 0)
    };
  } catch (error) {
    console.error("Error getting overdue payments:", error);
    throw new Error("Failed to get overdue payments");
  }
};
