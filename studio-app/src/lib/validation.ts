import { z } from 'zod';

/**
 * Validation schemas for critical application data
 */

// User/Staff validation
export const staffSchema = z.object({
  id: z.string().optional(),
  idNumber: z.string().min(1, "ID number is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
  role: z.enum(['admin', 'teacher', 'staff', 'support']),
  position: z.string().min(1, "Position is required"),
  department: z.string().optional(),
  phone: z.string().min(10, "Invalid phone number"),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  status: z.enum(['active', 'inactive']),
  salary: z.number().positive("Salary must be positive"),
});

// Student validation
export const studentSchema = z.object({
  id: z.string().optional(),
  idNumber: z.string().min(1, "ID number is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional(),
  gender: z.enum(['male', 'female']),
  grade: z.string().min(1, "Grade is required"),
  className: z.string().min(1, "Class name is required"),
  parentName: z.string().min(2, "Parent name is required"),
  contact: z.string().min(10, "Invalid contact number"),
  enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  status: z.enum(['active', 'inactive']),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
});

// Payroll validation
export const payslipItemSchema = z.object({
  label: z.string().min(1, "Label is required"),
  amount: z.number().nonnegative("Amount cannot be negative"),
});

export const payslipSchema = z.object({
  staffId: z.string().min(1, "Staff ID is required"),
  staffName: z.string().min(1, "Staff name is required"),
  baseSalary: z.number().positive("Base salary must be positive"),
  earnings: z.array(payslipItemSchema),
  deductions: z.array(payslipItemSchema),
  grossSalary: z.number().nonnegative("Gross salary cannot be negative"),
  totalDeductions: z.number().nonnegative("Total deductions cannot be negative"),
  netPay: z.number().nonnegative("Net pay cannot be negative"),
  employerCNSS: z.number().nonnegative().optional(),
  employerAMO: z.number().nonnegative().optional(),
});

export const payrollSchema = z.object({
  id: z.string().optional(),
  period: z.string().min(1, "Period is required"),
  runDate: z.string().optional(),
  totalAmount: z.number().positive("Total amount must be positive"),
  payslips: z.array(payslipSchema).min(1, "At least one payslip is required"),
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
});

// Payment validation
export const paymentSchema = z.object({
  id: z.string().optional(),
  studentId: z.string().min(1, "Student ID is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/, "Invalid date format"),
  method: z.enum(['cash', 'check', 'bank_transfer', 'card']),
  reference: z.string().optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

// Expense validation
export const expenseSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.number().positive("Amount must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Invalid date format"),
  description: z.string().min(1, "Description is required"),
  receipt: z.string().optional(),
  approvedBy: z.string().optional(),
});

// Authentication validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Token validation
export const parentAccessTokenSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  expiresAt: z.string().optional(),
  createdAt: z.string().optional(),
});

// Settings validation
export const schoolSettingsSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  currency: z.string().length(3, "Currency must be 3 letters (e.g., MAD)"),
  academicYear: z.string().min(1, "Academic year is required"),
  cnssRate: z.number().min(0).max(1, "CNSS rate must be between 0 and 1").optional(),
  amoRate: z.number().min(0).max(1, "AMO rate must be between 0 and 1").optional(),
  irBrackets: z.array(z.object({
    min: z.number().nonnegative(),
    max: z.number().positive(),
    rate: z.number().min(0).max(1),
  })).optional(),
});

// Sanitize and validate input
export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

// Safe validation that returns errors instead of throwing
export function safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
