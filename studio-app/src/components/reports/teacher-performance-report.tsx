"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Fixed imports
import { BookOpen, Download, Users, Star, Clock, Award } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";

import { getStaffMembers } from "@/services/staffService";
import { getCourses } from "@/services/courseService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { getAttendance } from "@/services/attendanceService";
import { getEnrollmentForCourse } from "@/services/enrollmentService";
import { getStudent } from "@/services/studentService";
import { useToast } from "@/hooks/use-toast";

// Types
interface StaffMember {
  id: string;
  name: string;
  role: string;
  status: string;
  department?: string;
}

interface Course {
  id: string;
  name: string;
  teachers: { id: string; name: string }[];
}

interface Student {
  id: string;
  name: string;
  grade?: string;
  className?: string;
}

interface TeacherPerformance {
  teacherId: string;
  teacherName: string;
  courses: number;
  totalStudents: number;
  averageGrade: number;
  passRate: number;
  attendanceRate: number;
  workload: number;
  rating: number;
}

interface CourseWorkload {
  courseId: string;
  courseName: string;
  teacherName: string;
  studentCount: number;
  averageGrade: number;
  passRate: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Arabic translation function
const t = (key: string): string => {
  const arabicTranslations: Record<string, string> = {
    'reports.exportReport': 'تصدير التقرير',
    'reports.totalTeachers': 'إجمالي الأساتذة',
    'reports.activeTeachers': 'الأساتذة النشطين',
    'reports.averageRating': 'متوسط التقييم',
    'reports.performanceRating': 'تقييم الأداء العام',
    'reports.totalCourses': 'إجمالي المواد',
    'reports.coursesTaught': 'المواد التي يتم تدريسها',
    'reports.avgWorkload': 'متوسط المواد المدرسة',
    'reports.coursesPerTeacher': 'مواد لكل استاذ',
    'reports.teacherPerformance': 'أداء الأساتذة',
    'reports.performanceRatingsByTeacher': 'تقييمات الأداء حسب الأستاذ',
    'reports.workloadDistribution': 'توزيع المواد المدرسة',
    'reports.coursesPerTeacherCount': 'عدد المواد لكل استاذ',
    'reports.topPerformingTeachers': 'أفضل الأساتذة أداءً',
    'reports.topPerformingTeachersDesc': 'الأساتذة بأعلى تقييمات الأداء',
    'reports.courses': 'مواد',
    'reports.students': 'طلاب',
    'reports.avgGrade': 'معدل',
    'reports.courseWorkload': 'عدد المواد',
    'reports.coursesWithMostStudents': 'المواد بعدد الطلاب الأكبر',
    'common.loading': 'جاري التحميل...',
    'common.department': 'القسم',
    'common.allDepartments': 'جميع الأقسام',
    'common.selectDepartment': 'اختر القسم'
  };
  return arabicTranslations[key] || key;
};

export function TeacherPerformanceReport() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [teacherPerformance, setTeacherPerformance] = useState<TeacherPerformance[]>([]);
  const [courseWorkload, setCourseWorkload] = useState<CourseWorkload[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalTeachers: 0,
    averageRating: 0,
    totalCourses: 0,
    averageWorkload: 0
  });

  const getStudentsForCourse = useCallback(async (courseId: string): Promise<Student[]> => {
    try {
      const enrollment = await getEnrollmentForCourse(courseId);
      if (!enrollment || !enrollment.studentIds || enrollment.studentIds.length === 0) {
        return [];
      }
      
      const studentPromises = enrollment.studentIds.map(id => getStudent(id));
      const students = await Promise.all(studentPromises);
      return students.filter(s => s !== null) as Student[];
    } catch (error) {
      console.error(`Error getting students for course ${courseId}:`, error);
      return [];
    }
  }, []);

  const fetchTeacherData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [staff, courses] = await Promise.all([
        getStaffMembers(),
        getCourses()
      ]);

      const teachers = (staff as StaffMember[]).filter(s => s.role === 'teacher' && s.status === 'active');
      const filteredTeachers = selectedDepartment === "all" 
        ? teachers
        : teachers.filter(t => t.department === selectedDepartment);

      const performancePromises = filteredTeachers.map(async (teacher) => {
        const teacherCourses = (courses as Course[]).filter(c => 
          c.teachers && Array.isArray(c.teachers) && c.teachers.some(t => t.id === teacher.id)
        );

        let totalStudents = 0;
        let totalGrades = 0;
        let gradeCount = 0;
        let passedStudents = 0;
        let totalAttendanceDays = 0;
        let presentDays = 0;

        for (const course of teacherCourses) {
          // Get students for this course
          const courseStudents = await getStudentsForCourse(course.id);
          totalStudents += courseStudents.length;

          // Calculate grades
          for (const student of courseStudents) {
            try {
              const grade = await getStudentGradeForCourse(course.id, student.id);
              // getStudentGradeForCourse returns number | null
              if (typeof grade === 'number' && !Number.isNaN(grade)) {
                totalGrades += grade;
                gradeCount++;
                if (grade >= 60) {
                  passedStudents++;
                }
              }
            } catch (error) {
              // No grade recorded
            }

            // Calculate attendance for this student in this course
            try {
              const attendance = await getAttendance(
                student.grade || '10', 
                student.className || 'أ', 
                new Date().toISOString().split('T')[0]
              );
              if (attendance && attendance.studentRecords && typeof attendance.studentRecords[student.id] !== 'undefined') {
                totalAttendanceDays++;
                if (attendance.studentRecords[student.id] === 'present') {
                  presentDays++;
                }
              }
            } catch (error) {
              // No attendance record
            }
          }
        }

        const averageGrade = gradeCount > 0 ? totalGrades / gradeCount : 0;
        const passRate = gradeCount > 0 ? (passedStudents / gradeCount) * 100 : 0;
        const attendanceRate = totalAttendanceDays > 0 ? (presentDays / totalAttendanceDays) * 100 : 0;
        const workload = teacherCourses.length;
        
        // Mock rating based on performance metrics
        const rating = Math.min(5, Math.max(1, 
          (averageGrade / 20) * 0.4 + 
          (passRate / 100) * 0.3 + 
          (attendanceRate / 100) * 0.3
        ));

        return {
          teacherId: teacher.id,
          teacherName: teacher.name,
          courses: teacherCourses.length,
          totalStudents,
          averageGrade: Math.round(averageGrade * 100) / 100,
          passRate: Math.round(passRate * 100) / 100,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          workload,
          rating: Math.round(rating * 10) / 10
        };
      });

      const performanceResults = await Promise.all(performancePromises);
      setTeacherPerformance(performanceResults);

      // Calculate course workload
      const workloadData: CourseWorkload[] = [];
      for (const course of courses as Course[]) {
        if (course.teachers && Array.isArray(course.teachers) && course.teachers.length > 0) {
          const courseStudents = await getStudentsForCourse(course.id);
          let totalGrades = 0;
          let gradeCount = 0;
          let passedStudents = 0;

          for (const student of courseStudents) {
            try {
              const grade = await getStudentGradeForCourse(course.id, student.id);
              if (typeof grade === 'number' && !Number.isNaN(grade)) {
                totalGrades += grade;
                gradeCount++;
                if (grade >= 60) {
                  passedStudents++;
                }
              }
            } catch (error) {
              // No grade recorded
            }
          }

          const averageGrade = gradeCount > 0 ? totalGrades / gradeCount : 0;
          const passRate = gradeCount > 0 ? (passedStudents / gradeCount) * 100 : 0;

          workloadData.push({
            courseId: course.id,
            courseName: course.name,
            teacherName: course.teachers[0]?.name || 'Unknown',
            studentCount: courseStudents.length,
            averageGrade: Math.round(averageGrade * 100) / 100,
            passRate: Math.round(passRate * 100) / 100
          });
        }
      }

      setCourseWorkload(workloadData);

      // Calculate overall stats
      const totalTeachers = performanceResults.length;
      const averageRating = totalTeachers > 0 
        ? performanceResults.reduce((sum, t) => sum + t.rating, 0) / totalTeachers 
        : 0;
      const totalCourses = performanceResults.reduce((sum, t) => sum + t.courses, 0);
      const averageWorkload = totalTeachers > 0 
        ? performanceResults.reduce((sum, t) => sum + t.workload, 0) / totalTeachers 
        : 0;

      setOverallStats({
        totalTeachers,
        averageRating: Math.round(averageRating * 100) / 100,
        totalCourses,
        averageWorkload: Math.round(averageWorkload * 100) / 100
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات الأساتذة. تأكد من وجود بيانات في النظام.",
        variant: "destructive"
      });
      console.error("Error fetching teacher data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartment, toast, getStudentsForCourse]);

  useEffect(() => {
    void fetchTeacherData();
  }, [fetchTeacherData]);

  const topPerformers = teacherPerformance
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const workloadDistribution = [
    { range: '١-٢ مادة', count: teacherPerformance.filter(t => t.workload <= 2).length },
    { range: '٣-٤ مواد', count: teacherPerformance.filter(t => t.workload >= 3 && t.workload <= 4).length },
    { range: '٥+ مواد', count: teacherPerformance.filter(t => t.workload >= 5).length }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder={t('common.selectDepartment')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.allDepartments')}</SelectItem>
            <SelectItem value="math">الرياضيات</SelectItem>
            <SelectItem value="science">العلوم</SelectItem>
            <SelectItem value="english">اللغة الإنجليزية</SelectItem>
            <SelectItem value="arabic">اللغة العربية</SelectItem>
            <SelectItem value="history">التاريخ</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline">
          <Download className="ml-2 h-4 w-4" />
          {t('reports.exportReport')}
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalTeachers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              {t('reports.activeTeachers')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.averageRating')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">
              {t('reports.performanceRating')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.totalCourses')}</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              {t('reports.coursesTaught')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reports.avgWorkload')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageWorkload}</div>
            <p className="text-xs text-muted-foreground">
              {t('reports.coursesPerTeacher')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Performance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.teacherPerformance')}</CardTitle>
            <CardDescription>{t('reports.performanceRatingsByTeacher')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teacherPerformance.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="teacherName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  fontSize={12}
                />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="rating" fill="#8884d8" name="التقييم" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع المواد المدرسة</CardTitle>
            <CardDescription>عدد المواد لكل استاذ</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workloadDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {workloadDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} معلم`, 'عدد']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Course Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              أفضل الأساتذة أداءً
            </CardTitle>
            <CardDescription>الأساتذة بأعلى تقييمات الأداء</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((teacher, index) => (
                <div key={teacher.teacherId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{teacher.teacherName}</p>
                      <p className="text-sm text-muted-foreground">
                        {teacher.courses} مادة، {teacher.totalStudents} طالب
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{teacher.rating}/5</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {teacher.averageGrade}% معدل الدرجات
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('reports.courseWorkload')}
            </CardTitle>
            <CardDescription>{t('reports.coursesWithMostStudents')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courseWorkload
                .sort((a, b) => b.studentCount - a.studentCount)
                .slice(0, 5)
                .map((course) => (
                <div key={course.courseId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{course.courseName}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.teacherName}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold">{course.studentCount} {t('reports.students')}</p>
                    <p className="text-xs text-muted-foreground">
                      {course.averageGrade}% {t('reports.avgGrade')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}