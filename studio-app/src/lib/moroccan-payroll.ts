/**
 * Moroccan Payroll Calculation Utilities
 * Based on Moroccan labor law and tax regulations
 */

import { PayslipItem } from "./types";

// --- Period parsing and proration helpers ---

const MONTHS_EN: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

function parsePeriodToRange(period: string): { start: Date; end: Date; totalDays: number } {
  // Expect formats like "December 2025" or localized variants already in English when generating
  // Fallback: try Date parsing with day 1
  const parts = period.trim().split(/\s+/);
  let monthIdx = -1;
  let year = NaN;
  if (parts.length >= 2) {
    const maybeMonth = parts[0].toLowerCase();
    if (MONTHS_EN.hasOwnProperty(maybeMonth)) {
      monthIdx = MONTHS_EN[maybeMonth];
      year = parseInt(parts[1], 10);
    }
  }
  if (monthIdx === -1 || !Number.isFinite(year)) {
    // Fallback best-effort
    const tentative = new Date(`${period} 1`);
    if (!isNaN(tentative.getTime())) {
      const start = new Date(tentative.getFullYear(), tentative.getMonth(), 1);
      const end = new Date(tentative.getFullYear(), tentative.getMonth() + 1, 0);
      return { start, end, totalDays: end.getDate() };
    }
    // As a last resort, use current month to avoid hard crash
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start, end, totalDays: end.getDate() };
  }
  const start = new Date(year, monthIdx, 1);
  const end = new Date(year, monthIdx + 1, 0);
  return { start, end, totalDays: end.getDate() };
}

function diffDaysInclusive(a: Date, b: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const aUTC = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUTC = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((bUTC - aUTC) / MS) + 1;
}

/**
 * Counts working days (Monday–Friday) between two dates, inclusive.
 * Uses Moroccan system: 5-day working week.
 */
function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Count Monday (1) through Friday (5)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calculates monthly working days in a period (Mon–Fri only, Moroccan system).
 */
function countMonthlyWorkingDays(period: string): number {
  const { start, end } = parsePeriodToRange(period);
  return countWorkingDays(start, end);
}

/**
 * Calculates prorated base salary for partial employment within a period (working-days method, Moroccan system).
 * - If hireDate > period end => 0 days (no pay)
 * - If hireDate <= period start => full month
 * - Else => from hire date through period end (inclusive), counting Mon–Fri only
 */
export function calculateProratedBase(
  baseSalary: number,
  hireDateISO: string | undefined,
  period: string
): { proratedBase: number; daysWorked: number; totalDays: number } {
  const { start, end } = parsePeriodToRange(period);
  const totalDays = countMonthlyWorkingDays(period);

  if (!hireDateISO) {
    return { proratedBase: round2(baseSalary), daysWorked: totalDays, totalDays };
  }

  const hire = new Date(hireDateISO);
  if (isNaN(hire.getTime())) {
    return { proratedBase: round2(baseSalary), daysWorked: totalDays, totalDays };
  }

  if (hire > end) {
    return { proratedBase: 0, daysWorked: 0, totalDays };
  }

  const effectiveStart = hire > start ? hire : start;
  const daysWorked = countWorkingDays(effectiveStart, end);
  const proratedBase = round2((baseSalary * daysWorked) / totalDays);
  return { proratedBase, daysWorked, totalDays };
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

// Moroccan Tax Rates (2025)
export const MOROCCAN_TAX_RATES = {
  cnssEmployee: 4.29, // Employee CNSS contribution (%)
  cnssEmployer: 12.89, // Employer CNSS contribution (%)
  amoEmployee: 2.26, // Employee AMO (health insurance) (%)
  amoEmployer: 4.11, // Employer AMO (%)
  formationProfessionnelle: 1.6, // Professional training tax (%)
};

// Income Tax Brackets (IR - Impôt sur le Revenu)
export const IR_BRACKETS = [
  { max: 2500, rate: 0 }, // 0% up to 2,500 MAD/month (30,000 MAD/year)
  { max: 4166.67, rate: 10 }, // 10% from 2,501 to 4,166.67 MAD/month
  { max: 5000, rate: 20 }, // 20% from 4,166.68 to 5,000 MAD/month
  { max: 6666.67, rate: 30 }, // 30% from 5,001 to 6,666.67 MAD/month
  { max: 15000, rate: 34 }, // 34% from 6,666.68 to 15,000 MAD/month
  { max: Infinity, rate: 38 }, // 38% above 15,000 MAD/month
];

/**
 * Calculate CNSS contribution (employee part)
 */
export function calculateCNSS(grossSalary: number): number {
  const cnssBase = Math.min(grossSalary, 6000); // CNSS capped at 6,000 MAD
  return Math.round((cnssBase * MOROCCAN_TAX_RATES.cnssEmployee) / 100 * 100) / 100;
}

/**
 * Calculate AMO contribution (employee part)
 */
export function calculateAMO(grossSalary: number): number {
  return Math.round((grossSalary * MOROCCAN_TAX_RATES.amoEmployee) / 100 * 100) / 100;
}

/**
 * Calculate IR (Income Tax) based on progressive brackets
 */
export function calculateIR(taxableIncome: number): number {
  let tax = 0;
  let previousMax = 0;

  for (const bracket of IR_BRACKETS) {
    if (taxableIncome <= previousMax) break;

    const taxableInBracket = Math.min(taxableIncome, bracket.max) - previousMax;
    tax += (taxableInBracket * bracket.rate) / 100;
    previousMax = bracket.max;

    if (taxableIncome <= bracket.max) break;
  }

  return Math.round(tax * 100) / 100;
}

/**
 * Calculate employer CNSS contribution
 */
export function calculateEmployerCNSS(grossSalary: number): number {
  const cnssBase = Math.min(grossSalary, 6000);
  return Math.round((cnssBase * MOROCCAN_TAX_RATES.cnssEmployer) / 100 * 100) / 100;
}

/**
 * Calculate employer AMO contribution
 */
export function calculateEmployerAMO(grossSalary: number): number {
  return Math.round((grossSalary * MOROCCAN_TAX_RATES.amoEmployer) / 100 * 100) / 100;
}

/**
 * Calculate overtime pay
 * @param baseSalary - Monthly base salary
 * @param hours - Overtime hours
 * @param rate - Overtime rate multiplier (1.25, 1.5, or 2.0)
 */
export function calculateOvertime(baseSalary: number, hours: number, rate: number = 1.25): number {
  // Assuming standard 191 working hours per month (44h/week * 52 weeks / 12 months)
  const hourlyRate = baseSalary / 191;
  return Math.round(hourlyRate * hours * rate * 100) / 100;
}

/**
 * Calculate taxable income (gross salary minus non-taxable deductions)
 */
export function calculateTaxableIncome(earnings: PayslipItem[], deductions: PayslipItem[]): number {
  const totalEarnings = earnings
    .filter(e => e.taxable !== false)
    .reduce((sum, e) => sum + e.amount, 0);

  const nonTaxableDeductions = deductions
    .filter(d => ['cnss', 'amo', 'cimr'].includes(d.category || ''))
    .reduce((sum, d) => sum + d.amount, 0);

  return totalEarnings - nonTaxableDeductions;
}

/**
 * Generate default payslip items for a staff member
 */
export function generateDefaultPayslipItems(baseSalary: number): {
  earnings: PayslipItem[];
  deductions: PayslipItem[];
} {
  const earnings: PayslipItem[] = [
    {
      id: 'base-salary',
      label: 'Salaire de base',
      amount: baseSalary,
      type: 'earning',
      category: 'base',
      taxable: true,
    },
  ];

  const grossSalary = earnings.reduce((sum, e) => sum + e.amount, 0);
  const cnss = calculateCNSS(grossSalary);
  const amo = calculateAMO(grossSalary);
  
  const deductions: PayslipItem[] = [
    {
      id: 'cnss',
      label: 'CNSS',
      amount: cnss,
      type: 'deduction',
      category: 'cnss',
      rate: MOROCCAN_TAX_RATES.cnssEmployee,
      taxable: false,
    },
    {
      id: 'amo',
      label: 'AMO',
      amount: amo,
      type: 'deduction',
      category: 'amo',
      rate: MOROCCAN_TAX_RATES.amoEmployee,
      taxable: false,
    },
  ];

  // Calculate IR
  const taxableIncome = calculateTaxableIncome(earnings, deductions);
  const ir = calculateIR(taxableIncome);

  if (ir > 0) {
    deductions.push({
      id: 'ir',
      label: 'IR (Impôt sur le Revenu)',
      amount: ir,
      type: 'deduction',
      category: 'tax',
      taxable: false,
    });
  }

  return { earnings, deductions };
}

/**
 * Recalculate all deductions based on current earnings
 */
export function recalculateDeductions(
  earnings: PayslipItem[],
  existingDeductions: PayslipItem[]
): PayslipItem[] {
  const grossSalary = earnings.reduce((sum, e) => sum + e.amount, 0);

  // Update CNSS
  const cnss = calculateCNSS(grossSalary);
  const amo = calculateAMO(grossSalary);

  const updatedDeductions = existingDeductions.map(d => {
    if (d.category === 'cnss') {
      return { ...d, amount: cnss };
    }
    if (d.category === 'amo') {
      return { ...d, amount: amo };
    }
    return d;
  });

  // Recalculate IR
  const taxableIncome = calculateTaxableIncome(earnings, updatedDeductions);
  const ir = calculateIR(taxableIncome);

  const irIndex = updatedDeductions.findIndex(d => d.category === 'tax' && d.id === 'ir');
  if (irIndex >= 0) {
    updatedDeductions[irIndex] = { ...updatedDeductions[irIndex], amount: ir };
  } else if (ir > 0) {
    updatedDeductions.push({
      id: 'ir',
      label: 'IR (Impôt sur le Revenu)',
      amount: ir,
      type: 'deduction',
      category: 'tax',
      taxable: false,
    });
  }

  return updatedDeductions;
}

/**
 * Create an overtime earning item
 */
export function createOvertimeItem(
  baseSalary: number,
  hours: number,
  rate: number = 1.25,
  id?: string
): PayslipItem {
  const amount = calculateOvertime(baseSalary, hours, rate);
  return {
    id: id || `overtime-${Date.now()}`,
    label: `Heures supplémentaires (${hours}h à ${rate * 100}%)`,
    amount,
    type: 'earning',
    category: 'overtime',
    taxable: true,
    hours,
    hourlyRate: baseSalary / 191,
  };
}
