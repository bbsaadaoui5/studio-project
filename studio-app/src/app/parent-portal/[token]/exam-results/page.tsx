"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { Exam } from "@/lib/types";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { getExams } from "@/services/examService";
import { getCourse } from "@/services/courseService";
import { getExamScores } from "@/services/gradeService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Award } from "lucide-react";
import { format, isPast } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";

interface ExamWithScore extends Exam {
  courseName: string;
  score?: number | null;
}

export default function ExamResultsPage() {
  const params = useParams();
  const token = params.token as string;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentGrade, setStudentGrade] = useState<string | null>(null);
  const [studentClassName, setStudentClassName] = useState<string | null>(null);
  const [exams, setExams] = useState<ExamWithScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExamResults = useCallback(async () => {
    if (!studentGrade || !studentClassName || !studentId) return;

    setIsLoading(true);
    try {
      const allExams = await getExams();
      
      // Filter exams for this student's class
      const studentClassId = `${studentGrade}-${studentClassName}`;
      const studentExams = allExams.filter((exam: any) => 
        (exam.classes || []).includes(studentClassId)
      );

      // Fetch scores and course info for each exam
      const examsWithScores = await Promise.all(
        studentExams.map(async (exam: any) => {
          const course = await getCourse(exam.courseId);
          const scoreData = await getExamScores(exam.id);
          const studentScore = scoreData?.studentScores?.[studentId]?.score;

          return {
            ...exam,
            courseName: course?.name || exam.courseName || "Unknown Course",
            score: studentScore || null
          };
        })
      );

      // Sort by date
      setExams(examsWithScores.sort((a: any, b: any) => 
        new Date(b.examDate).getTime() - new Date(a.examDate).getTime()
      ));
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "فشل تحميل نتائج الامتحانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentGrade, studentClassName, studentId, toast, t]);

  useEffect(() => {
    const verifyAndFetch = async () => {
      try {
        const studentData = await validateParentAccessToken(token);
        if (!studentData) notFound();

        setStudentId(studentData.id);
        
        const student = await getStudent(studentData.id);
        if (student) {
          setStudentGrade(student.grade);
          setStudentClassName(student.className);
        }
      } catch (error) {
        toast({ title: t("common.error"), description: "التحقق من البيانات فشل", variant: "destructive" });
        notFound();
      }
    };

    verifyAndFetch();
  }, [token, toast, t]);

  useEffect(() => {
    fetchExamResults();
  }, [fetchExamResults]);

  const completedExams = exams.filter((exam) => isPast(new Date(exam.examDate)) && exam.score !== null);
  const pendingExams = exams.filter((exam) => isPast(new Date(exam.examDate)) && exam.score === null);
  const upcomingExams = exams.filter((exam) => !isPast(new Date(exam.examDate)));

  const averageScore = completedExams.length > 0 
    ? (completedExams.reduce((sum, e) => sum + (e.score || 0), 0) / completedExams.length).toFixed(1)
    : 0;

  const getScoreBadgeColor = (score: number | null | undefined) => {
    if (score === null || score === undefined) return "bg-gray-100 text-gray-800";
    if (score >= 90) return "bg-green-100 text-green-800";
    if (score >= 80) return "bg-emerald-100 text-emerald-800";
    if (score >= 70) return "bg-blue-100 text-blue-800";
    if (score >= 50) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const ScoreDisplay = ({ score }: { score: number | null | undefined }) => {
    if (score === null || score === undefined) {
      return <span className="text-sm text-muted-foreground">قيد الانتظار</span>;
    }
    return (
      <div className="text-right">
        <Badge className={`text-lg px-3 py-1 ${getScoreBadgeColor(score)}`}>
          {score}
        </Badge>
        <p className="text-xs text-muted-foreground mt-1">
          {score >= 90 ? "ممتاز 🌟" : score >= 80 ? "جيد جداً 👍" : score >= 70 ? "جيد" : score >= 50 ? "مقبول" : "يحتاج متابعة"}
        </p>
      </div>
    );
  };

  const ExamResultCard = ({ exam }: { exam: ExamWithScore }) => {
    const examDate = new Date(exam.examDate);

    return (
      <Card className="border-r-4 border-r-blue-500 hover:shadow-md transition-shadow">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">التاريخ</p>
              <p className="font-bold text-sm">{format(examDate, "dd MMM yyyy")}</p>
              <p className="text-xs text-muted-foreground mt-1">{format(examDate, "HH:mm")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">الامتحان</p>
              <p className="font-bold text-sm">{exam.title}</p>
              <p className="text-xs text-muted-foreground mt-1">{exam.courseName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">المدة</p>
              <p className="text-sm">{exam.duration} دقيقة</p>
              {(exam as any).room && (
                <p className="text-xs text-muted-foreground mt-1">📍 {(exam as any).room}</p>
              )}
            </div>
            <div className="flex justify-end">
              <ScoreDisplay score={exam.score} />
            </div>
          </div>

          {(exam as any).instructions && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground font-semibold">ملاحظات</p>
              <p className="text-sm text-muted-foreground mt-1">{(exam as any).instructions}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Card */}
      {completedExams.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              ملخص الأداء
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">المتوسط العام</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{averageScore}</p>
                <p className="text-xs text-muted-foreground mt-1">من {completedExams.length} امتحان</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">الأفضل</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {Math.max(...completedExams.map(e => e.score || 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">أعلى درجة</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">الحالة</p>
                <div className="flex gap-2 mt-2">
                  <div>
                    <Badge variant="outline">{completedExams.length} مكتملة</Badge>
                  </div>
                  {pendingExams.length > 0 && (
                    <Badge variant="outline" className="bg-yellow-50">{pendingExams.length} قيد الانتظار</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Exams */}
      {completedExams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">النتائج المنشورة</h2>
          <div className="space-y-3">
            {completedExams.map((exam) => (
              <ExamResultCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {/* Pending Results */}
      {pendingExams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">قيد الانتظار</h2>
          <div className="space-y-3">
            {pendingExams.map((exam) => (
              <ExamResultCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Exams */}
      {upcomingExams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">الامتحانات القادمة</h2>
          <div className="space-y-3 opacity-75">
            {upcomingExams.map((exam) => (
              <ExamResultCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {exams.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">لا توجد نتائج امتحانات</p>
            <p className="text-sm text-muted-foreground mt-2">
              لم يتم جدولة أي امتحانات لفصلك حالياً
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
