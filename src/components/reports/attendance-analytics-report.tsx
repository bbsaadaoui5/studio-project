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
  Calendar, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  Download
} from "lucide-react";
import { getStudents } from "@/services/studentService";
import { getAttendance } from "@/services/attendanceService";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface AttendanceData {
  studentId: string;
  studentName: string;
  grade: string;
  className: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
}

interface DailyAttendance {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  attendanceRate: number;
}

const COLORS = ['#00C49F', '#FFBB28', '#FF8042'];

export function AttendanceAnalyticsReport() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState<string>("all");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("30");
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance[]>([]);
  const [overallStats, setOverallStats] = useState({
    averageAttendance: 0,
    totalStudents: 0,
    perfectAttendance: 0,
    chronicAbsenteeism: 0
  });

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedGrade, selectedClass, dateRange]);

  const fetchAttendanceData = async () => {
    setIsLoading(true);
    try {
      const students = await getStudents();
      const filteredStudents = students.filter(s => {
        if (s.status !== 'active') return false;
        if (selectedGrade !== "all" && s.grade !== selectedGrade) return false;
        if (selectedClass !== "all" && s.className !== selectedClass) return false;
        return true;
      });

      const endDate = new Date();
      const startDate = subDays(endDate, parseInt(dateRange));
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      const attendancePromises = filteredStudents.map(async (student) => {
        let presentDays = 0;
        let absentDays = 0;
        let lateDays = 0;
        let totalDays = 0;

        for (const day of days) {
          try {
            const dateString = format(day, "yyyy-MM-dd");
            const attendance = await getAttendance(student.grade, student.className, dateString);
            
            if (attendance && attendance.studentRecords[student.id]) {
              totalDays++;
              const status = attendance.studentRecords[student.id];
              switch (status) {
                case 'present':
                  presentDays++;
                  break;
                case 'absent':
                  absentDays++;
                  break;
                case 'late':
                  lateDays++;
                  break;
              }
            }
          } catch (error) {
            // No attendance record for this day
          }
        }

        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        return {
          studentId: student.id,
          studentName: student.name,
          grade: student.grade,
          className: student.className,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        };
      });

      const results = await Promise.all(attendancePromises);
      setAttendanceData(results);

      // Calculate daily attendance
      const dailyData: DailyAttendance[] = [];
      for (const day of days) {
        const dateString = format(day, "yyyy-MM-dd");
        let present = 0;
        let absent = 0;
        let late = 0;
        let total = 0;

        for (const student of filteredStudents) {
          try {
            const attendance = await getAttendance(student.grade, student.className, dateString);
            if (attendance && attendance.studentRecords[student.id]) {
              total++;
              const status = attendance.studentRecords[student.id];
              switch (status) {
                case 'present':
                  present++;
                  break;
                case 'absent':
                  absent++;
                  break;
                case 'late':
                  late++;
                  break;
              }
            }
          } catch (error) {
            // No attendance record
          }
        }

        const attendanceRate = total > 0 ? (present / total) * 100 : 0;

        dailyData.push({
          date: format(day, "MMM dd"),
          present,
          absent,
          late,
          total,
          attendanceRate: Math.round(attendanceRate * 100) / 100
        });
      }

      setDailyAttendance(dailyData);

      // Calculate overall stats
      const validStudents = results.filter(r => r.totalDays > 0);
      const averageAttendance = validStudents.length > 0 
        ? validStudents.reduce((sum, r) => sum + r.attendanceRate, 0) / validStudents.length 
        : 0;

      const perfectAttendance = validStudents.filter(r => r.attendanceRate === 100).length;
      const chronicAbsenteeism = validStudents.filter(r => r.attendanceRate < 80).length;

      setOverallStats({
        averageAttendance: Math.round(averageAttendance * 100) / 100,
        totalStudents: validStudents.length,
        perfectAttendance,
        chronicAbsenteeism
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const attendanceDistribution = [
    { status: 'Present', count: attendanceData.reduce((sum, s) => sum + s.presentDays, 0) },
    { status: 'Late', count: attendanceData.reduce((sum, s) => sum + s.lateDays, 0) },
    { status: 'Absent', count: attendanceData.reduce((sum, s) => sum + s.absentDays, 0) }
  ];

  const topAttendees = attendanceData
    .filter(s => s.totalDays > 0)
    .sort((a, b) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5);

  const poorAttendees = attendanceData
    .filter(s => s.totalDays > 0 && s.attendanceRate < 80)
    .sort((a, b) => a.attendanceRate - b.attendanceRate);

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
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Grades</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>
                  Grade {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="A">Class A</SelectItem>
              <SelectItem value="B">Class B</SelectItem>
              <SelectItem value="C">Class C</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
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
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageAttendance}%</div>
            <p className="text-xs text-muted-foreground">
              Across all students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfect Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.perfectAttendance}</div>
            <p className="text-xs text-muted-foreground">
              Students with 100%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chronic Absenteeism</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overallStats.chronicAbsenteeism}</div>
            <p className="text-xs text-muted-foreground">
              Below 80% attendance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              With attendance records
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Attendance Trend</CardTitle>
            <CardDescription>Attendance rate over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="attendanceRate" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
            <CardDescription>Breakdown of attendance status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count }) => `${status}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {attendanceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Attendees and Poor Attendees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Top Attendees
            </CardTitle>
            <CardDescription>Students with highest attendance rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAttendees.map((student, index) => (
                <div key={student.studentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        Grade {student.grade} - {student.className}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{student.attendanceRate}%</p>
                    <p className="text-xs text-muted-foreground">
                      {student.presentDays}/{student.totalDays} days
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
              Students Needing Attention
            </CardTitle>
            <CardDescription>Students with attendance below 80%</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {poorAttendees.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No students with poor attendance
                </p>
              ) : (
                poorAttendees.map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        Grade {student.grade} - {student.className}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">{student.attendanceRate}%</p>
                      <Progress 
                        value={student.attendanceRate} 
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
