"use client";

import { useEffect, useState } from "react";
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
  Users, 
  BookOpen, 
  TrendingUp, 
  Award,
  AlertTriangle,
  Clock,
  Loader2,
  Download,
  Star
} from "lucide-react";
import { getStaffMembers } from "@/services/staffService";
import { getCourses } from "@/services/courseService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { getAttendance } from "@/services/attendanceService";
import { useToast } from "@/hooks/use-toast";

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

  useEffect(() => {
    fetchTeacherData();
  }, [selectedDepartment]);

  const fetchTeacherData = async () => {
    setIsLoading(true);
    try {
      const [staff, courses] = await Promise.all([
        getStaffMembers(),
        getCourses()
      ]);

      const teachers = staff.filter(s => s.role === 'teacher' && s.status === 'active');
      const filteredTeachers = selectedDepartment === "all" 
        ? teachers
        : teachers.filter(t => t.department === selectedDepartment);

      const performancePromises = filteredTeachers.map(async (teacher) => {
        const teacherCourses = courses.filter(c => 
          c.teachers.some(t => t.id === teacher.id)
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
              if (grade && grade.score !== null) {
                totalGrades += grade.score;
                gradeCount++;
                if (grade.score >= 60) {
                  passedStudents++;
                }
              }
            } catch (error) {
              // No grade recorded
            }

            // Calculate attendance for this student in this course
            try {
              const attendance = await getAttendance(student.grade, student.className, new Date().toISOString().split('T')[0]);
              if (attendance && attendance.studentRecords[student.id]) {
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
      for (const course of courses) {
        if (course.teachers.length > 0) {
          const courseStudents = await getStudentsForCourse(course.id);
          let totalGrades = 0;
          let gradeCount = 0;
          let passedStudents = 0;

          for (const student of courseStudents) {
            try {
              const grade = await getStudentGradeForCourse(course.id, student.id);
              if (grade && grade.score !== null) {
                totalGrades += grade.score;
                gradeCount++;
                if (grade.score >= 60) {
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
            teacherName: course.teachers[0].name,
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
        title: "Error",
        description: "Failed to fetch teacher data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mock function to get students for a course
  const getStudentsForCourse = async (courseId: string) => {
    // This would typically come from enrollment service
    // For now, return empty array
    return [];
  };

  const topPerformers = teacherPerformance
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const workloadDistribution = [
    { range: '1-2 courses', count: teacherPerformance.filter(t => t.workload <= 2).length },
    { range: '3-4 courses', count: teacherPerformance.filter(t => t.workload >= 3 && t.workload <= 4).length },
    { range: '5+ courses', count: teacherPerformance.filter(t => t.workload >= 5).length }
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
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Mathematics">Mathematics</SelectItem>
              <SelectItem value="Science">Science</SelectItem>
              <SelectItem value="Languages">Languages</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Physical Education">Physical Education</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Active teachers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageRating}/5</div>
            <p className="text-xs text-muted-foreground">
              Performance rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Courses taught
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Workload</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageWorkload}</div>
            <p className="text-xs text-muted-foreground">
              Courses per teacher
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Teacher Performance</CardTitle>
            <CardDescription>Performance ratings by teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={teacherPerformance.slice(0, 8)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="teacherName" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rating" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Workload Distribution</CardTitle>
            <CardDescription>Number of courses per teacher</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={workloadDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {workloadDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
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
              Top Performing Teachers
            </CardTitle>
            <CardDescription>Teachers with highest performance ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((teacher, index) => (
                <div key={teacher.teacherId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{teacher.teacherName}</p>
                      <p className="text-sm text-muted-foreground">
                        {teacher.courses} courses, {teacher.totalStudents} students
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-bold">{teacher.rating}/5</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {teacher.averageGrade}% avg grade
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
              Course Workload
            </CardTitle>
            <CardDescription>Courses with highest student counts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {courseWorkload
                .sort((a, b) => b.studentCount - a.studentCount)
                .slice(0, 5)
                .map((course) => (
                <div key={course.courseId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{course.courseName}</p>
                    <p className="text-sm text-muted-foreground">
                      {course.teacherName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{course.studentCount} students</p>
                    <p className="text-xs text-muted-foreground">
                      {course.averageGrade}% avg grade
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
