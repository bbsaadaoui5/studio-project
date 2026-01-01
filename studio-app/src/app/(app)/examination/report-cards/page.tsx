
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getStudents } from "@/services/studentService";
import { generateReportCard } from "@/services/reportCardService";
import { Student, ReportCard, ReportCardCourse } from "@/lib/types";
import { Loader2, FileText, Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type GeneratingState = "idle" | "fetching" | "compiling" | "writing" | "done";

export default function ReportCardsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [reportingPeriod, setReportingPeriod] = useState<string>("");
  const [generatedReport, setGeneratedReport] = useState<ReportCard | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [generatingState, setGeneratingState] = useState<GeneratingState>("idle");
  // توليد الفترات الدراسية ديناميكياً حسب السنة الحالية والسنة السابقة
  const currentYear = new Date().getFullYear();
  const reportingPeriods = [
    `الفصل الأول ${currentYear}`,
    `الفصل الثاني ${currentYear}`,
    `الفصل الأول ${currentYear - 1}`,
    `الفصل الثاني ${currentYear - 1}`
  ];

  const generatingMessages: Record<GeneratingState, string> = {
  idle: "إنشاء التقرير بالذكاء الاصطناعي",
  fetching: "جاري جلب البيانات...",
  compiling: "جاري تجميع الدرجات...",
  writing: "جاري كتابة التعليقات...",
  done: "تم!",
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const fetchedStudents = await getStudents();
        setStudents(fetchedStudents.filter(s => s.status === 'active'));
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch students.", variant: "destructive" });
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [toast]);
  
  const handleGenerateReport = async () => {
    if (!selectedStudent || !reportingPeriod) {
        toast({ title: "Missing Information", description: "Please select a student and enter a reporting period.", variant: "destructive"});
        return;
    }
    setGeneratedReport(null);
    try {
        // This is a simplified simulation of multi-stage progress
        setGeneratingState("fetching");
        await new Promise(res => setTimeout(res, 500));
        setGeneratingState("compiling");
        const report: ReportCard = {
          studentId: selectedStudent,
          studentName: students.find(s => s.id === selectedStudent)?.name || 'Unknown',
          class: students.find(s => s.id === selectedStudent)?.className || '',
          reportingPeriod,
          overallSummary: 'هذا ملخص تجريبي لنتيجة الطالب.',
          courses: []
        };
        setGeneratingState("writing");
        await new Promise(res => setTimeout(res, 1500)); // Simulate AI writing time
  setGeneratedReport(report);
        setGeneratingState("done");
    } catch (error) {
        console.error(error);
        toast({ title: "Error Generating Report", description: "An unexpected error occurred. Please check the data and try again.", variant: "destructive"});
        setGeneratingState("idle");
    } finally {
        setTimeout(() => setGeneratingState("idle"), 2000);
    }
  }
  
  const isGenerating = generatingState !== 'idle' && generatingState !== 'done';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>إنشاء كشف الدرجات</CardTitle>
            <CardDescription>
              اختر الطالب والفترة لإصدار كشف الدرجات مع تعليقات ذكية.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="student-select">الطالب</Label>
                <Select onValueChange={setSelectedStudent} value={selectedStudent} disabled={isLoadingStudents}>
                    <SelectTrigger id="student-select">
                        <SelectValue placeholder="اختر الطالب..." />
                    </SelectTrigger>
                    <SelectContent>
                        {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reporting-period">الفترة الدراسية</Label>
                <Select onValueChange={setReportingPeriod} value={reportingPeriod}>
                  <SelectTrigger id="reporting-period">
                    <SelectValue placeholder="اختر الفترة الدراسية..." />
                  </SelectTrigger>
                  <SelectContent>
                    {reportingPeriods.map((period, idx) => (
                      <SelectItem key={idx} value={period}>{period}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleGenerateReport} disabled={isGenerating || !selectedStudent || !reportingPeriod}>
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                {generatingMessages[generatingState]}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-2">
     <Card className="min-h-[600px]">
       {isGenerating && (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">{generatingMessages[generatingState]}</p>
        </div>
      )}
       {!isGenerating && !generatedReport && (
        <div className="flex flex-col items-center justify-center h-full text-center p-6">
          <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">سيظهر كشف الدرجات هنا بعد إنشائه.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            اختر الطالب والفترة الدراسية للبدء.
          </p>
        </div>
      )}
      {generatedReport && (
        <>
        <CardHeader className="bg-muted/30">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">كشف الدرجات</CardTitle>
              <CardDescription>سجل الأداء الأكاديمي الرسمي.</CardDescription>
            </div>
            <div className="text-right">
               <p className="font-bold">{generatedReport.studentName}</p>
               <p className="text-sm text-muted-foreground">{generatedReport.class}</p>
               <p className="text-sm text-muted-foreground">{generatedReport.reportingPeriod}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold border-b pb-2">الملخص العام</h3>
              <p className="text-muted-foreground pt-3 text-sm italic">
                {generatedReport.overallSummary || "لا يوجد ملخص متاح."}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold border-b pb-2">أداء المواد</h3>
              <div className="space-y-4 pt-3">
                {Array.isArray(generatedReport.courses) && generatedReport.courses.length > 0 ? (
                  generatedReport.courses.map((course, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold">{course.courseName}</h4>
                        <div className="text-right">
                          <p className="font-bold text-lg">{course.finalGrade}</p>
                          <p className="text-xs text-muted-foreground">الدرجة النهائية</p>
                        </div>
                      </div>
                       <p className="text-xs text-muted-foreground">المعلم: {course.teacherName}</p>
                       <Separator className="my-2" />
                      <p className="text-sm text-muted-foreground mt-2">{course.comments}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground">لا توجد بيانات مواد متاحة.</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        </>
      )}
     </Card>
      </div>
    </div>
  );
}
