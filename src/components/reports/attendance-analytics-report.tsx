"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Download, Users, Award, CheckCircle, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis
} from "recharts";

function AttendanceAnalyticsReport() {
  const { t } = useTranslation();
  const [selectedGrade, setSelectedGrade] = useState("all");
  // Mock data for demonstration/build
  const overallStats = {
    averageAttendance: 95,
    perfectAttendance: 42,
  };
  const attendanceDistribution = [
    { range: "95-100%", count: 30 },
    { range: "90-94%", count: 20 },
    { range: "80-89%", count: 10 },
    { range: "<80%", count: 5 },
  ];
  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#f87171"];
  const dailyAttendance = [
    { date: "2025-10-01", present: 50, absent: 2, late: 1 },
    { date: "2025-10-02", present: 48, absent: 3, late: 2 },
    { date: "2025-10-03", present: 49, absent: 1, late: 3 },
  ];
  const topAttendees = [
    { studentId: 1, studentName: "Student A", grade: 5, className: "A", attendanceRate: 100, presentDays: 30, totalDays: 30 },
    { studentId: 2, studentName: "Student B", grade: 6, className: "B", attendanceRate: 99, presentDays: 29, totalDays: 30 },
  ];
  const poorAttendees = [
    { studentId: 3, studentName: "Student C", grade: 7, className: "C", attendanceRate: 75, presentDays: 22, totalDays: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-48 text-right">
              <SelectValue placeholder={t('reports.selectGrade')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reports.allGrades')}</SelectItem>
              {Array.from({ length: 12 }, (_, i) => (
                <SelectItem key={i + 1} value={`${i + 1}`}>
                  {t('common.grade')} {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="text-right">
          <Download className="ml-2 h-4 w-4" />
          {t('reports.exportReport')}
        </Button>
      </div>

      {/* Attendance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">{t('reports.averageAttendance')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{overallStats.averageAttendance}%</div>
            <p className="text-xs text-muted-foreground text-right">
              {t('reports.acrossAllStudents')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-right">{t('reports.perfectAttendance')}</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-right">{overallStats.perfectAttendance}</div>
            <p className="text-xs text-muted-foreground text-right">
              {t('reports.studentsWithPerfectAttendance')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.attendanceDistribution')}</CardTitle>
            <CardDescription>{t('reports.attendanceDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={attendanceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, count }) => `${range}: ${count}`}
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

        {/* Daily Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.dailyAttendance')}</CardTitle>
            <CardDescription>{t('reports.attendanceByDay')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyAttendance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="present" fill="#8884d8" name={t('reports.present')} />
                <Bar dataKey="absent" fill="#f87171" name={t('reports.absent')} />
                <Bar dataKey="late" fill="#fbbf24" name={t('reports.late')} />
              </BarChart>
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
              {t('reports.topAttendees')}
            </CardTitle>
            <CardDescription>{t('reports.studentsWithHighestAttendance')}</CardDescription>
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
                        {t('common.grade')} {student.grade} - {student.className}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{student.attendanceRate}%</p>
                    <p className="text-xs text-muted-foreground">
                      {student.presentDays}/{student.totalDays} {t('reports.days')}
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
              {t('reports.studentsNeedingAttention')}
            </CardTitle>
            <CardDescription>{t('reports.studentsWithAttendanceBelow80')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {poorAttendees.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {t('reports.noStudentsWithPoorAttendance')}
                </p>
              ) : (
                poorAttendees.map((student) => (
                  <div key={student.studentId} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{student.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('common.grade')} {student.grade} - {student.className}
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

// Also provide a named export for compatibility with modules that import
// `{ AttendanceAnalyticsReport }` instead of the default export.
export { AttendanceAnalyticsReport };

export default AttendanceAnalyticsReport;
