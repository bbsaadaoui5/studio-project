"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { Exam, Course } from "@/lib/types";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { getExams } from "@/services/examService";
import { getCourse } from "@/services/courseService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, BookOpen, MapPin } from "lucide-react";
import { format, isPast, isFuture } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";

export default function ExamsPage() {
  const params = useParams();
  const token = params.token as string;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentGrade, setStudentGrade] = useState<string | null>(null);
  const [studentClassName, setStudentClassName] = useState<string | null>(null);
  const [exams, setExams] = useState<(Exam & { courseName: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExams = useCallback(async () => {
    if (!studentGrade || !studentClassName) return;

    setIsLoading(true);
    try {
      const allExams = await getExams();
      
      // Filter exams for this student's class
      const studentClassId = `${studentGrade}-${studentClassName}`;
      const studentExams = allExams.filter((exam: any) => 
        (exam.classes || []).includes(studentClassId)
      );

      // Fetch course names to show full details
      const examsWithCourses = await Promise.all(
        studentExams.map(async (exam: any) => {
          const course = await getCourse(exam.courseId);
          return {
            ...exam,
            courseName: course?.name || exam.courseName || "Unknown Course"
          };
        })
      );

      setExams(examsWithCourses.sort((a: any, b: any) => 
        new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
      ));
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "فشل تحميل الامتحانات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentGrade, studentClassName, toast, t]);

  useEffect(() => {
    const verifyAndFetch = async () => {
      try {
        const studentData = await validateParentAccessToken(token);
        if (!studentData) notFound();

        setStudentId(studentData.id);
        
        // Fetch full student details to get grade and className
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
    fetchExams();
  }, [fetchExams]);

  const upcomingExams = exams.filter((exam) => isFuture(new Date(exam.examDate)));
  const pastExams = exams.filter((exam) => isPast(new Date(exam.examDate)));

  const ExamCard = ({ exam }: { exam: Exam & { courseName: string } }) => {
    const examDate = new Date(exam.examDate);
    const isUpcoming = isFuture(examDate);

    return (
      <Card className={`border-r-4 ${isUpcoming ? "border-r-blue-500" : "border-r-gray-400"} hover:shadow-md transition-shadow`}>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
            <div>
              <p className="text-xs text-muted-foreground font-semibold">التاريخ والوقت</p>
              <p className="font-bold text-sm">{format(examDate, "dd MMM")}</p>
              <p className="text-sm flex items-center gap-1 mt-1">
                <Clock className="h-3 w-3" />
                {format(examDate, "HH:mm")}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">الامتحان</p>
              <p className="font-bold text-sm">{exam.title}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">المقرر</p>
              <p className="text-sm">{exam.courseName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-semibold">المدة / القاعة</p>
              <p className="text-sm">{exam.duration} دقيقة{(exam as any).room ? ` • ${(exam as any).room}` : ""}</p>
            </div>
            <div>
              <Badge className={isUpcoming ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"}>
                {isUpcoming ? "قادم" : "انتهى"}
              </Badge>
            </div>
          </div>
          
          {(exam as any).instructions && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground font-semibold">تعليمات خاصة</p>
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
      <Card>
        <CardHeader>
          <CardTitle>جدول الامتحانات</CardTitle>
          <CardDescription>
            عرض جميع الامتحانات القادمة والماضية
          </CardDescription>
        </CardHeader>
      </Card>

      {upcomingExams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">الامتحانات القادمة</h2>
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {pastExams.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">الامتحانات المنتهية</h2>
          <div className="space-y-3 opacity-75">
            {pastExams.map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
        </div>
      )}

      {exams.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          لا توجد امتحانات مجدولة لفصلك حالياً.
        </div>
      )}
    </div>
  );
}
