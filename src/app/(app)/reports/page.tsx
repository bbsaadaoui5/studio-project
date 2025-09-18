"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { AcademicPerformanceReport } from "@/components/reports/academic-performance-report";
import { AttendanceAnalyticsReport } from "@/components/reports/attendance-analytics-report";
import { TeacherPerformanceReport } from "@/components/reports/teacher-performance-report";
import { StudentProgressReport } from "@/components/reports/student-progress-report";
import { CustomReportBuilder } from "@/components/reports/custom-report-builder";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("academic");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into academic performance, attendance, and school operations.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export All
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="academic" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Academic
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Teachers
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-6">
          <AcademicPerformanceReport />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <AttendanceAnalyticsReport />
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          <TeacherPerformanceReport />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <StudentProgressReport />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          <CustomReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
