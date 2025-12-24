import { jest } from '@jest/globals';

// Mock dependent services before importing the finance service
const getStudentMock = jest.fn() as any;
const getCoursesForStudentMock = jest.fn() as any;
const getCourseMock = jest.fn() as any;

jest.mock('@/services/studentService', () => ({
  getStudent: (...args: any[]) => getStudentMock(...args),
}));

jest.mock('@/services/enrollmentService', () => ({
  getCoursesForStudent: (...args: any[]) => getCoursesForStudentMock(...args),
}));

jest.mock('@/services/courseService', () => ({
  getCourse: (...args: any[]) => getCourseMock(...args),
}));

import * as financeService from '@/services/financeService';
import type { FeeStructure, Course } from '@/lib/types';

describe('getCombinedMonthlyDueForStudent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns grade monthly when no support courses', async () => {
    // Arrange: student with a grade
    getStudentMock.mockResolvedValueOnce({ id: 'stu1', grade: '5', enrollmentDate: '2024-09-01' } as any);
    getCoursesForStudentMock.mockResolvedValueOnce([] as any);

    // Spy on fee structure resolver to return monthlyAmount 100
    jest.spyOn(financeService, 'getFeeStructureForGrade').mockResolvedValueOnce({ id: '5-2024', grade: '5', academicYear: '2024', monthlyAmount: 100 } as FeeStructure);

    // Act
    const res = await financeService.getCombinedMonthlyDueForStudent('stu1', '2024');

    // Assert
    expect(res.gradeMonthly).toBe(100);
    expect(res.supportMonthly).toBe(0);
    expect(res.combinedMonthly).toBe(100);
  });

  test('aggregates support course monthly fees and adds to grade fee', async () => {
    getStudentMock.mockResolvedValueOnce({ id: 'stu2', grade: '6', enrollmentDate: '2024-09-01' } as any);
    getCoursesForStudentMock.mockResolvedValueOnce(['c1', 'c2'] as any);

    // fee structure for grade 6
    jest.spyOn(financeService, 'getFeeStructureForGrade').mockResolvedValueOnce({ id: '6-2024', grade: '6', academicYear: '2024', monthlyAmount: 200 } as FeeStructure);

    // support courses (monthlyFee set)
    getCourseMock.mockImplementation(async (id: any) => {
      const map: Record<string, Partial<Course>> = {
        c1: { id: 'c1', type: 'support', monthlyFee: 30, name: 'Support A', teachers: [], description: '', credits: 0, department: '', grade: '6', createdAt: new Date().toISOString() },
        c2: { id: 'c2', type: 'support', monthlyFee: 20, name: 'Support B', teachers: [], description: '', credits: 0, department: '', grade: '6', createdAt: new Date().toISOString() },
      };
      return map[id] || null;
    });

    const res = await financeService.getCombinedMonthlyDueForStudent('stu2', '2024');

    expect(res.gradeMonthly).toBe(200);
    expect(res.supportMonthly).toBe(50);
    expect(res.combinedMonthly).toBe(250);
  });

  test('handles missing student by returning zeros', async () => {
    getStudentMock.mockResolvedValueOnce(null as any);
    const res = await financeService.getCombinedMonthlyDueForStudent('missing', '2024');
    expect(res.gradeMonthly).toBe(0);
    expect(res.supportMonthly).toBe(0);
    expect(res.combinedMonthly).toBe(0);
  });

  test('skips grade fee when grade is N/A and still sums support fees', async () => {
    getStudentMock.mockResolvedValueOnce({ id: 'stu3', grade: 'N/A' } as any);
    getCoursesForStudentMock.mockResolvedValueOnce(['c3'] as any);
    // ensure feeStructure is not used; but spy just in case
    jest.spyOn(financeService, 'getFeeStructureForGrade').mockResolvedValueOnce(null);

    getCourseMock.mockResolvedValueOnce({ id: 'c3', type: 'support', monthlyFee: 45, name: 'Support C', teachers: [], description: '', credits: 0, department: '', grade: '', createdAt: new Date().toISOString() } as any);

    const res = await financeService.getCombinedMonthlyDueForStudent('stu3', '2024');
    expect(res.gradeMonthly).toBe(0);
    expect(res.supportMonthly).toBe(45);
    expect(res.combinedMonthly).toBe(45);
  });
});
