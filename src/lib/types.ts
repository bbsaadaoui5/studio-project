

export type Student = {
  id: string;
  idNumber: string;
  name: string;
  email?: string; // Made optional
  gender: "male" | "female";
  studentType: "regular" | "support";
  supportCourseId?: string;
  teacher?: string;
  teacherId?: string;
  grade: string;
  className: string;
  parentName: string;
  contact: string;
  altContact?: string;
  enrollmentDate: string;
  status: "active" | "inactive";
  address: string;
  dateOfBirth: string; // ISO Date String
  medicalNotes?: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  audience?: 'teachers' | 'parents' | 'both';
  createdAt: string;
};

export type Course = {
  id: string;
  name: string;
  teachers: { id: string; name: string }[];
  description: string;
  credits: number;
  department: string;
  grade: string;
  type: "academic" | "support";
  createdAt: string;
};

export type Staff = {
  id:string;
  idNumber: string;
  name: string;
  position?: string; 
  department?: string; 
  email?: string;
  phone: string;
  altPhone?: string;
  gender: "male" | "female";
  address: string;
  dateOfBirth: string; // ISO Date String
  qualifications: string;
  role: "teacher" | "admin" | "support";
  hireDate: string;
  status: "active" | "inactive";
  paymentType?: "salary" | "commission" | "headcount";
  paymentRate?: number;
  salary?: number; // Keep legacy salary for backwards compatibility
};

export type Enrollment = {
    id: string; // Document ID is courseId
    courseId: string;
    studentIds: string[];
}

export type AttendanceStatus = "present" | "absent" | "late";

export type AttendanceRecord = {
  id?: string; // Firestore doc ID, format: `grade_className_date`
  grade: string;
  className: string;
  date: string; // ISO string for the date, e.g., "2024-07-30"
  studentIds: string[]; // For efficient querying
  studentRecords: {
    [studentId: string]: AttendanceStatus;
  }
}

export type StaffAttendanceStatus = "present" | "absent" | "on-leave";

export type StaffAttendanceRecord = {
  id?: string; // Firestore doc ID, format: date "yyyy-MM-dd"
  date: string;
  staffRecords: {
    [staffId: string]: StaffAttendanceStatus;
  }
};


export type Assignment = {
    id: string;
    courseId: string;
    name: string;
    totalPoints: number;
}

export type Grade = {
    id: string; // doc id is assignmentId
    assignmentId: string;
    studentGrades: {
        [studentId: string]: {
            score: number | null;
        }
    }
}

export type ExamScore = {
    id: string; // doc id is examId
    examId: string;
    studentScores: {
        [studentId: string]: {
            score: number | null;
        }
    }
}

export type FeeStructure = {
  id: string; // grade-academicYear
  grade: string;
  academicYear: string;
  monthlyAmount: number;
};

export type Payment = {
  id: string;
  studentId: string;
  amount: number;
  date: string; // ISO Date String
  month: string; // e.g., "September"
  academicYear: string;
  method: "card" | "cash" | "bank-transfer";
};

export type StudentFeeStatus = {
  id: string; // studentId
  studentId: string;
  totalDue: number;
  totalPaid: number;
  balance: number;
}

export type Expense = {
  id?: string;
  date: string;
  amount: number;
  category: "salaries" | "utilities" | "supplies" | "maintenance" | "other";
  description: string;
};

export type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  status: "available" | "loaned";
  loanedTo?: string; // studentId
  dueDate?: string; // ISO Date String
};

export type LibraryLoan = {
  id: string;
  bookId: string;
  studentId: string;
  loanDate: string;
  dueDate: string; // ISO Date String
  returnDate?: string; // ISO Date String
};

export type ReportCardCourse = {
    courseName: string;
    teacherName: string;
    finalGrade: string | number;
    comments: string;
};

export type ReportCard = {
    studentId: string;
    studentName: string;
    class: string;
    reportingPeriod: string;
    overallSummary: string;
    courses: ReportCardCourse[];
};

export type ParentAccess = {
  id: string; // The token itself
  studentId: string;
  createdAt: string; // ISO Date String
}

export type Parent = {
  id: string; // Firebase Auth UID
  name: string;
  email: string;
  phone?: string;
  linkedStudentIds: string[]; // Students this parent can view
  createdAt: string; // ISO Date String
  status: "active" | "inactive";
}

export type Payslip = {
    staffId: string;
    staffName: string;
    salary: number;
    bonus: number;
    deductions: number;
    netPay: number;
};

export type Payroll = {
    id: string;
    period: string; // e.g., "July 2024"
    runDate: string; // ISO Date String
    totalAmount: number;
    payslips: Payslip[];
};

export type AdmissionApplication = {
    id: string;
    applicantName: string;
    applicantEmail: string;
    gradeApplyingFor: string;
    parentName: string;
    parentContact: string;
    previousSchool?: string;
    applicationDate: string; // ISO Date String
    status: 'pending' | 'approved' | 'rejected';
    address?: string;
    dateOfBirth?: string;
}

export type TimetableEntry = {
    id: string;
    grade: string; 
    className: string;
    day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday";
    timeSlot: string; // e.g., "09:00-10:00"
    courseId: string;
    courseName: string;
    teacherName: string;
    notes?: string;
}

export type StaffReview = {
  id: string;
  staffId: string;
  staffName: string;
  reviewDate: string; // ISO Date String
  reviewerName: string;
  summary: string;
  rating: number; // e.g., 1-5
};

export type InventoryItem = {
  id: string;
  name: string;
  category: "electronics" | "furniture" | "lab-equipment" | "sports-gear" | "other";
  status: "available" | "in-use" | "under-maintenance";
  location: string;
  purchaseDate: string; // ISO Date String
};

export type Exam = {
    id: string;
    courseId: string;
    courseName: string;
    title: string;
    examDate: string; // ISO Date String
    duration: number; // in minutes
}

export type SchoolEvent = {
  id: string;
  title: string;
  description: string;
  date: string; // ISO Date String, "yyyy-MM-dd"
  category: "holiday" | "exam" | "meeting" | "activity";
};

export type ClassInfo = {
  id: string; // e.g., "9-A"
  grade: string;
  className: string;
  studentCount: number;
}

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  address?: string;
}

export type Role = {
  id: string;
  name: string;
  description: string;
  userCount: number;
}
