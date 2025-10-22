"use client";

import { useEffect, useState, useCallback } from "react";
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
  AreaChart,
  Area
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen,
  Award,
  AlertTriangle,
  Loader2,
  Download,
  Target
} from "lucide-react";
import { getStudents } from "@/services/studentService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { getAttendance } from "@/services/attendanceService";
import { useToast } from "@/hooks/use-toast";

interface StudentProgress {
  studentId: string;
  studentName: string;
  grade: string;
  className: string;
  currentAverage: number;
  previousAverage: number;
  improvement: number;
  attendanceRate: number;
  coursesCompleted: number;
  coursesInProgress: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface GradeTrend {
  month: string;
  average: number;
  attendance: number;
}

export function StudentProgressReport() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([]);
  const [gradeTrends, setGradeTrends] = useState<GradeTrend[]>([]);
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    averageImprovement: 0,
    highRiskStudents: 0,
    excellentProgress: 0
  });

  const fetchProgressData = useCallback(async () => {
    setIsLoading(true);
    try {
      const students = await getStudents();
      const filteredStudents = students.filter(s => {
        if (s.status !== 'active') return false;
        if (selectedGrade !== "all" && s.grade !== selectedGrade) return false;
        if (selectedClass !== "all" && s.className !== selectedClass) return false;
        return true;
      });

      const progressPromises = filteredStudents.map(async (student) => {
        // Mock data for demonstration
        const currentAverage = Math.random() * 40 + 60; // 60-100
        const previousAverage = Math.random() * 40 + 50; // 50-90
        const improvement = currentAverage - previousAverage;
        const attendanceRate = Math.random() * 30 + 70; // 70-100
        const coursesCompleted = Math.floor(Math.random() * 5) + 1;
        const coursesInProgress = Math.floor(Math.random() * 3) + 1;

        let riskLevel: 'low' | 'medium' | 'high' = 'low';
        if (currentAverage < 60 || attendanceRate < 80) {
          riskLevel = 'high';
        } else if (currentAverage < 70 || attendanceRate < 90) {
          riskLevel = 'medium';
        }

        return {
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          className: student.className,
          currentAverage: Math.round(currentAverage * 100) / 100,
          previousAverage: Math.round(previousAverage * 100) / 100,
          improvement: Math.round(improvement * 100) / 100,
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          coursesCompleted,
          coursesInProgress,
          riskLevel
        };
      });

      const progressResults = await Promise.all(progressPromises);
      setStudentProgress(progressResults);

      // Generate mock grade trends
      const trends: GradeTrend[] = [];
      for (let i = 5; i >= 0; i--) {
        const month = new Date();
        month.setMonth(month.getMonth() - i);
        trends.push({
          month: month.toLocaleDateString('en-US', { month: 'short' }),
          average: Math.random() * 20 + 70,
          attendance: Math.random() * 15 + 85
        });
      }
      setGradeTrends(trends);

      // Calculate overall stats
      const totalStudents = progressResults.length;
      const averageImprovement = totalStudents > 0 
        ? progressResults.reduce((sum, s) => sum + s.improvement, 0) / totalStudents 
        : 0;
      const highRiskStudents = progressResults.filter(s => s.riskLevel === 'high').length;
      const excellentProgress = progressResults.filter(s => s.improvement > 10).length;

      setOverallStats({
        totalStudents,
        averageImprovement: Math.round(averageImprovement * 100) / 100,
        highRiskStudents,
        excellentProgress
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch progress data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedGrade, selectedClass, toast]);

  useEffect(() => {
    void fetchProgressData();
  }, [fetchProgressData]);
  const topImprovers = studentProgress
    .filter(s => s.improvement > 0)
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 5);

  const highRiskStudents = studentProgress
    .filter(s => s.riskLevel === 'high')
    .sort((a, b) => a.currentAverage - b.currentAverage);

  const riskDistribution = [
    { level: 'Low Risk', count: studentProgress.filter(s => s.riskLevel === 'low').length, color: '#00C49F' },
    { level: 'Medium Risk', count: studentProgress.filter(s => s.riskLevel === 'medium').length, color: '#FFBB28' },
    { level: 'High Risk', count: studentProgress.filter(s => s.riskLevel === 'high').length, color: '#FF8042' }
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
      {/* Filters */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="اختر المستوى" />
  <SelectValue placeholder="اختر المستوى" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المستويات</SelectItem>
  <SelectItem value="all">جميع المستويات</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}> 
                  المستوى {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="اختر القسم" />
  <SelectValue placeholder="اختر القسم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأقسام</SelectItem>
  <SelectItem value="all">جميع الأقسام</SelectItem>
              <SelectItem value="A">القسم أ</SelectItem>
  <SelectItem value="A">القسم أ</SelectItem>
              <SelectItem value="B">القسم ب</SelectItem>
  <SelectItem value="B">القسم ب</SelectItem>
              <SelectItem value="C">القسم ج</SelectItem>
  <SelectItem value="C">القسم ج</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          تصدير التقرير
  تصدير التقرير
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
  <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              الطلاب النشطون
  الطلاب النشطون
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">متوسط التحسن</CardTitle>
  <CardTitle className="text-sm font-medium">متوسط التحسن</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{overallStats.averageImprovement}%
            </div>
            <p className="text-xs text-muted-foreground">
              التحسن في المعدل
  التحسن في المعدل
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلاب بحاجة للدعم</CardTitle>
  <CardTitle className="text-sm font-medium">طلاب بحاجة للدعم</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.highRiskStudents}</div>
            <p className="text-xs text-muted-foreground">
              الطلاب المحتاجون للمتابعة
  الطلاب المحتاجون للمتابعة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">طلاب متفوقون</CardTitle>
  <CardTitle className="text-sm font-medium">طلاب متفوقون</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{overallStats.excellentProgress}</div>
            <p className="text-xs text-muted-foreground">
              تحسن أكثر من 10%
  تحسن أكثر من 10%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Trends */}
        <Card>
          <CardHeader>
            <CardTitle>اتجاهات المعدل والحضور</CardTitle>
  <CardTitle>اتجاهات المعدل والحضور</CardTitle>
            <CardDescription>اتجاهات آخر 6 أشهر</CardDescription>
  <CardDescription>اتجاهات آخر 6 أشهر</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={gradeTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8"
                  name="متوسط المعدل"
                />
                <Area 
                  type="monotone" 
                  dataKey="attendance" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d"
                  name="نسبة الحضور"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>توزيع الطلاب حسب مستوى الخطورة</CardTitle>
            <CardDescription>عدد الطلاب حسب مستوى الخطورة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskDistribution.map((risk) => (
                <div key={risk.level} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: risk.color }}
                    />
                    <span className="font-medium">{risk.level === 'Low Risk' ? 'منخفضة' : risk.level === 'Medium Risk' ? 'متوسطة' : 'مرتفعة'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{risk.count}</span>
                    <span className="text-sm text-muted-foreground">
                      ({Math.round((risk.count / overallStats.totalStudents) * 100)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Improvers and High Risk Students */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              الطلاب الأكثر تحسنًا
            </CardTitle>
            <CardDescription>قائمة الطلاب الذين حققوا أكبر تحسن في المعدل</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topImprovers.map((student, index) => (
                <div key={student.studentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        المستوى {student.grade} - {student.className}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">+{student.improvement}%</p>
                    <p className="text-xs text-muted-foreground">
                      {student.previousAverage}% → {student.currentAverage}%
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
              الطلاب الأكثر عرضة للخطر
            </CardTitle>
            <CardDescription>قائمة الطلاب الذين يحتاجون إلى دعم إضافي</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highRiskStudents.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  لا يوجد طلاب بحاجة للدعم
                </p>
              ) : (
                highRiskStudents.map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        المستوى {student.grade} - {student.className}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{student.currentAverage}%</p>
                      <div className="flex items-center gap-2">
                        <Progress value={student.currentAverage} className="w-16 h-2" />
                        <Badge variant="destructive">طلاب بحاجة للدعم</Badge>
                      </div>
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
