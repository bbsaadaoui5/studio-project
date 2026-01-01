"use client";

import { useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

interface ReportFilters {
  grade: string;
  dateRange: string;
  department: string;
}

export default function ReportsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("academic");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    grade: "all",
    dateRange: "all",
    department: "all"
  });

  const handleDownloadAll = () => {
    // Generate CSV data based on active tab with translated headers
    const reportTypeLabels: Record<string, string> = {
      academic: t('academicReports') || 'Academic Reports',
      attendance: t('attendanceReports') || 'Attendance Reports',
      teachers: t('teacherReports') || 'Teacher Reports',
      progress: t('progressReports') || 'Progress Reports',
      custom: t('customReports') || 'Custom Reports'
    };

    const reportName = `${activeTab}-report-${new Date().toISOString().split('T')[0]}.csv`;
    
    // Build CSV with translated headers
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `${t('reports.reportType') || 'Report Type'},${t('reports.generatedDate') || 'Generated Date'},${t('reports.filters') || 'Filters'}\n`;
    csvContent += `${reportTypeLabels[activeTab]},${new Date().toLocaleString('ar-SA')},${t('common.grade')}: ${filters.grade} | ${t('reports.dateRange')}: ${filters.dateRange} | ${t('common.department')}: ${filters.department}\n\n`;
    
    // Add report-specific headers based on active tab with translations
    if (activeTab === "academic") {
      csvContent += `${t('common.student') || 'Student'},${t('common.grade') || 'Grade'},${t('reports.averageScore') || 'Average Score'},${t('reports.status') || 'Status'}\n`;
      csvContent += "الطالب 1,10,85,نجح\n";
      csvContent += "الطالب 2,10,92,نجح\n";
    } else if (activeTab === "attendance") {
      csvContent += `${t('common.student') || 'Student'},${t('common.grade') || 'Grade'},${t('reports.attendanceRate') || 'Attendance Rate'},${t('reports.presentDays') || 'Present Days'},${t('reports.totalDays') || 'Total Days'}\n`;
      csvContent += "الطالب 1,10,95%,28,30\n";
      csvContent += "الطالب 2,10,100%,30,30\n";
    } else if (activeTab === "teachers") {
      csvContent += `${t('reports.teacherName') || 'Teacher Name'},${t('common.department') || 'Department'},${t('reports.coursesTaught') || 'Courses Taught'},${t('reports.averageRating') || 'Average Rating'}\n`;
      csvContent += "المعلم أ,الرياضيات,3,4.5\n";
      csvContent += "المعلم ب,العلوم,2,4.8\n";
    } else if (activeTab === "progress") {
      csvContent += `${t('common.student') || 'Student'},${t('common.grade') || 'Grade'},${t('reports.progressScore') || 'Progress Score'},${t('reports.improvement') || 'Improvement'}\n`;
      csvContent += "الطالب 1,10,85,+5\n";
    } else if (activeTab === "custom") {
      csvContent += `${t('reports.customReportData') || 'Custom Report Data'}\n`;
      csvContent += `${t('reports.configureYourReport') || 'Configure your report in the Custom Reports tab'}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", reportName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyFilters = () => {
    setShowFilterDialog(false);
    // Filters are applied through the filters state which is passed to components
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-right">{t('reports.generalReports') || 'General Reports'}</h1>
          <p className="text-muted-foreground text-right">
            {t('reports.generalReportsDesc') || 'All academic and administrative reports in one place'}
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-right" aria-label={t('reports.filter') || 'Filter reports'}>
                <Filter className="ml-2 h-4 w-4" />
                {t('reports.filter') || 'Filter'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-right">{t('reports.filter') || 'Filter Reports'}</DialogTitle>
                <DialogDescription className="text-right">
                  تخصيص معايير التقرير
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="grade-filter" className="text-right">{t('common.grade') || 'Grade'}</Label>
                  <Select value={filters.grade} onValueChange={(value) => setFilters({...filters, grade: value})}>
                    <SelectTrigger id="grade-filter" className="text-right">
                      <SelectValue placeholder={t('reports.selectGrade') || 'Select grade'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('reports.allGrades') || 'All grades'}</SelectItem>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={`${i + 1}`}>
                          {t('common.grade')} {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date-filter" className="text-right">النطاق الزمني</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters({...filters, dateRange: value})}>
                    <SelectTrigger id="date-filter" className="text-right">
                      <SelectValue placeholder="اختر النطاق الزمني" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الفترات</SelectItem>
                      <SelectItem value="today">اليوم</SelectItem>
                      <SelectItem value="week">هذا الأسبوع</SelectItem>
                      <SelectItem value="month">هذا الشهر</SelectItem>
                      <SelectItem value="semester">هذا الفصل</SelectItem>
                      <SelectItem value="year">هذا العام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dept-filter" className="text-right">القسم</Label>
                  <Select value={filters.department} onValueChange={(value) => setFilters({...filters, department: value})}>
                    <SelectTrigger id="dept-filter" className="text-right">
                      <SelectValue placeholder="اختر القسم" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأقسام</SelectItem>
                      <SelectItem value="academic">الأكاديمي</SelectItem>
                      <SelectItem value="admin">الإداري</SelectItem>
                      <SelectItem value="finance">المالي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowFilterDialog(false)}>
                  {t('common.cancel') || 'Cancel'}
                </Button>
                <Button onClick={applyFilters}>
                  تطبيق الفلاتر
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="text-right" onClick={handleDownloadAll} aria-label={t('reports.downloadAll') || 'Download all reports'}>
            <Download className="ml-2 h-4 w-4" />
            {t('reports.downloadAll') || 'Download All'}
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
            تقارير الأساتذة
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
          <AcademicPerformanceReport filters={filters} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          {/* تقارير الحضور */}
          <AttendanceAnalyticsReport filters={filters} />
        </TabsContent>

        <TabsContent value="teachers" className="mt-6">
          {/* تقارير الأساتذة */}
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
