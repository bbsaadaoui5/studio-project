"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
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
import AttendanceAnalyticsReport from "@/components/reports/attendance-analytics-report";
import { TeacherPerformanceReport } from "@/components/reports/teacher-performance-report";
import { StudentProgressReport } from "@/components/reports/student-progress-report";
import { CustomReportBuilder } from "@/components/reports/custom-report-builder";

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("academic");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-right">التقارير العامة</h1>
          <p className="text-muted-foreground text-right">
            جميع تقارير المؤسسة الأكاديمية والإدارية في مكان واحد
          </p>
        </div>
        <div className="flex gap-2">
              <Button variant="outline" className="text-right" aria-label={t('reports.filter') || 'Filter reports'}>
                <Filter className="ml-2 h-4 w-4" />
                الفلاتر
              </Button>
              <Button variant="outline" className="text-right" aria-label={t('reports.downloadAll') || 'Download all reports'}>
                <Download className="ml-2 h-4 w-4" />
                تصدير الكل
              </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="academic" className="flex items-center gap-2 text-right">
            <BookOpen className="h-4 w-4" />
            تقارير أكاديمية
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2 text-right">
            <Calendar className="h-4 w-4" />
            تقارير الحضور
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2 text-right">
            <Users className="h-4 w-4" />
            تقارير المعلمين
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2 text-right">
            <TrendingUp className="h-4 w-4" />
            تقارير التقدم
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2 text-right">
            <BarChart3 className="h-4 w-4" />
            تقارير مخصصة
          </TabsTrigger>
        </TabsList>

        <TabsContent value="academic" className="mt-6">
          {/* تقارير الأداء الأكاديمي */}
          <AcademicPerformanceReport />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          {/* تقارير الحضور */}
          <AttendanceAnalyticsReport />
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          {/* تقارير المعلمين */}
          <TeacherPerformanceReport />
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          {/* تقارير التقدم */}
          <StudentProgressReport />
        </TabsContent>

        <TabsContent value="custom" className="mt-6">
          {/* تقارير مخصصة */}
          <CustomReportBuilder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
