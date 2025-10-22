"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  BookOpen, 
  Award, 
  AlertTriangle,
  Loader2,
  Download
} from "lucide-react";
import { getStudents } from "@/services/studentService";
import { getCourses } from "@/services/courseService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { useToast } from "@/hooks/use-toast";

interface GradeData {
  studentId: string;
  studentName: string;
  grade: string;
  className: string;
  averageGrade: number;
  totalCourses: number;
  passedCourses: number;
  failedCourses: number;
}

interface CoursePerformance {
  courseId: string;
  courseName: string;
  averageGrade: number;
  totalStudents: number;
  passRate: number;
  gradeDistribution: { grade: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function AcademicPerformanceReport() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [gradeData, setGradeData] = useState<GradeData[]>([]);
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance[]>([]);
  const [overallStats, setOverallStats] = useState({
    averageGrade: 0,
    passRate: 0,
    totalStudents: 0,
    totalCourses: 0
  });

  const fetchAcademicData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [students, courses] = await Promise.all([
        getStudents(),
        getCourses()
      ]);

      const filteredStudents = selectedGrade === "all" 
        ? students.filter(s => s.status === 'active')
        : students.filter(s => s.status === 'active' && s.grade === selectedGrade);

      const gradeDataPromises = filteredStudents.map(async (student) => {
        const studentGrades: number[] = [];
        let passedCourses = 0;
        let failedCourses = 0;

          for (const course of courses) {
            try {
              const grade = await getStudentGradeForCourse(course.id, student.id);
              if (grade !== null && typeof grade === 'number') {
                studentGrades.push(grade);
                if (grade >= 60) {
                  passedCourses++;
                } else {
                  failedCourses++;
                }
              }
            } catch (error) {
              // Course not taken by student
            }
          }

        const averageGrade = studentGrades.length > 0 
          ? studentGrades.reduce((sum, grade) => sum + grade, 0) / studentGrades.length 
          : 0;

        return {
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          className: student.className,
          averageGrade: isNaN(averageGrade) ? 0 : Math.round(averageGrade * 100) / 100,
          totalCourses: studentGrades.length,
          passedCourses,
          failedCourses
        };
      });

      const gradeResults = await Promise.all(gradeDataPromises);
      setGradeData(gradeResults);

      // Calculate course performance
      const coursePerformancePromises = courses.map(async (course) => {
        const courseGrades: number[] = [];
        
        for (const student of filteredStudents) {
          try {
            const grade = await getStudentGradeForCourse(course.id, student.id);
            if (grade !== null && typeof grade === 'number') {
              courseGrades.push(grade);
            }
          } catch (error) {
            // Student not enrolled in course
          }
        }

        const averageGrade = courseGrades.length > 0 
          ? courseGrades.reduce((sum, grade) => sum + grade, 0) / courseGrades.length 
          : 0;

        const passRate = courseGrades.length > 0 
          ? (courseGrades.filter(grade => grade >= 60).length / courseGrades.length) * 100 
          : 0;

        // Grade distribution
        const gradeDistribution = [
          { grade: 'A (90-100)', count: courseGrades.filter(g => g >= 90).length },
          { grade: 'B (80-89)', count: courseGrades.filter(g => g >= 80 && g < 90).length },
          { grade: 'C (70-79)', count: courseGrades.filter(g => g >= 70 && g < 80).length },
          { grade: 'D (60-69)', count: courseGrades.filter(g => g >= 60 && g < 70).length },
          { grade: 'F (0-59)', count: courseGrades.filter(g => g < 60).length }
        ];

        return {
          courseId: course.id,
          courseName: course.name,
          averageGrade: isNaN(averageGrade) ? 0 : Math.round(averageGrade * 100) / 100,
          totalStudents: courseGrades.length,
          passRate: isNaN(passRate) ? 0 : Math.round(passRate * 100) / 100,
          gradeDistribution
        };
      });

      const courseResults = await Promise.all(coursePerformancePromises);
      setCoursePerformance(courseResults);

      // Calculate overall stats
      const allGrades = gradeResults.flatMap(r => r.averageGrade).filter(g => g > 0);
      const overallAverage = allGrades.length > 0 
        ? allGrades.reduce((sum, grade) => sum + grade, 0) / allGrades.length 
        : 0;

      const totalPassed = gradeResults.reduce((sum, r) => sum + r.passedCourses, 0);
      const totalCourses = gradeResults.reduce((sum, r) => sum + r.totalCourses, 0);
      const overallPassRate = totalCourses > 0 ? (totalPassed / totalCourses) * 100 : 0;

      setOverallStats({
        averageGrade: isNaN(overallAverage) ? 0 : Math.round(overallAverage * 100) / 100,
        passRate: isNaN(overallPassRate) ? 0 : Math.round(overallPassRate * 100) / 100,
        totalStudents: gradeResults.length,
        totalCourses: courses.length
      });

    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في جلب بيانات الأداء الأكاديمي.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedGrade, toast]);

  useEffect(() => {
    void fetchAcademicData();
  }, [fetchAcademicData]);
  const topPerformers = gradeData
    .filter(s => s.averageGrade > 0)
    .sort((a, b) => b.averageGrade - a.averageGrade)
    .slice(0, 5);

  const strugglingStudents = gradeData
    .filter(s => s.averageGrade > 0 && s.averageGrade < 60)
    .sort((a, b) => a.averageGrade - b.averageGrade);

  const gradeDistribution = [
    { grade: 'A (90-100)', count: gradeData.filter(s => s.averageGrade >= 90).length },
    { grade: 'B (80-89)', count: gradeData.filter(s => s.averageGrade >= 80 && s.averageGrade < 90).length },
    { grade: 'C (70-79)', count: gradeData.filter(s => s.averageGrade >= 70 && s.averageGrade < 80).length },
    { grade: 'D (60-69)', count: gradeData.filter(s => s.averageGrade >= 60 && s.averageGrade < 70).length },
    { grade: 'F (0-59)', count: gradeData.filter(s => s.averageGrade > 0 && s.averageGrade < 60).length }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* الفلاتر ونظرة عامة */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-48 text-right">
              <SelectValue placeholder="اختر المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>
                  الصف {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="text-right">
          <Download className="ml-2 h-4 w-4" />
          تصدير التقرير
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">متوسط المعدل</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{overallStats.averageGrade}%</div>
            <p className="text-xs text-muted-foreground text-right">
              لجميع الطلاب
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">نسبة النجاح</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{overallStats.passRate}%</div>
            <p className="text-xs text-muted-foreground text-right">
              الطلاب الناجحون
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              الطلاب النشطون
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">عدد المقررات</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              عدد المقررات المتاحة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الدرجات</CardTitle>
            <CardDescription>نسبة توزيع الدرجات على جميع الطلاب</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ grade, count }) => `${grade}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card>
          <CardHeader>
            <CardTitle>أداء المقررات</CardTitle>
            <CardDescription>متوسط أداء الطلاب في كل مقرر دراسي</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={coursePerformance.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="courseName" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="averageGrade" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers and Struggling Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              الطلاب المتفوقون
            </CardTitle>
            <CardDescription>قائمة الطلاب الأعلى أداءً في المؤسسة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((student, index) => (
                <div key={student.studentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        الصف {student.grade} - {student.className}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{student.averageGrade}%</p>
                    <p className="text-xs text-muted-foreground">
                      {student.passedCourses}/{student.totalCourses} مقررات
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
              <AlertTriangle className="h-5 w-5" />
              الطلاب المحتاجون للدعم (10/20 أو أقل)
            </CardTitle>
            <CardDescription>قائمة الطلاب الذين حصلوا على 10/20 أو أقل ويحتاجون إلى دعم إضافي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {strugglingStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا يوجد طلاب حصلوا على 10/20 أو أقل
                </p>
              ) : (
                strugglingStudents.map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        الصف {student.grade} - {student.className}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{student.averageGrade}%</p>
                      <Progress 
                        value={student.averageGrade} 
                        className="w-16 h-2"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
