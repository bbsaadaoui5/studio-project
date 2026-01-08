
"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Save, BarChart3, Download } from "lucide-react";
import { Exam, Student, ExamScore } from "@/lib/types";
import { getExams } from "@/services/examService";
import { useToast } from "@/hooks/use-toast";
import { getEnrollmentForCourse } from "@/services/enrollmentService";
import { getStudent, getStudents } from "@/services/studentService";
import { saveExamScores, getExamScores } from "@/services/gradeService";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ExamResultsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number | null }>>({});
  const [examClasses, setExamClasses] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const [selectedExam, setSelectedExam] = useState<string>("");
  
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      setIsLoadingExams(true);
      try {
        const fetchedExams = await getExams();
        setExams(fetchedExams);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch exams.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingExams(false);
      }
    };
    fetchExams();
  }, [toast]);

  useEffect(() => {
    if (!selectedExam) {
      setEnrolledStudents([]);
      setScores({});
      setExamClasses([]);
      setSelectedClass("all");
      return;
    }

    const fetchStudentsAndScores = async () => {
      setIsLoadingStudents(true);
      try {
        const examDetails = exams.find(e => e.id === selectedExam);
        if (!examDetails) return;

        // Get all students from enrollment
        const enrollment = await getEnrollmentForCourse(examDetails.courseId);
        let students: Student[] = [];
        
        if (enrollment && enrollment.studentIds.length > 0) {
          const studentPromises = enrollment.studentIds.map(id => getStudent(id));
          students = (await Promise.all(studentPromises)).filter(s => s) as Student[];
        } else {
          // Moroccan fallback: get students by grade and className from exam classes
          const allStudents = await getStudents();
          const examClassesSet = new Set((examDetails as any).classes || []);
          students = allStudents.filter((s: any) => {
            const classId = `${s.grade}-${s.className}`;
            return examClassesSet.has(classId);
          });
        }

        // Extract unique classes
        const classesSet = new Set(students.map((s: any) => `${s.grade}-${s.className}`));
        setExamClasses(Array.from(classesSet).sort());

        // Filter by selected class
        const filteredStudents = selectedClass === "all" 
          ? students 
          : students.filter((s: any) => `${s.grade}-${s.className}` === selectedClass);

        setEnrolledStudents(filteredStudents);

        // Fetch existing scores
        const scoreData = await getExamScores(selectedExam);
        setScores(scoreData?.studentScores || {});

      } catch (error) {
        toast({ title: t('common.error'), description: t('common.failedToFetch'), variant: "destructive" });
        setEnrolledStudents([]);
        setScores({});
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudentsAndScores();
  }, [selectedExam, selectedClass, exams, toast, t]);
  
  const handleScoreChange = (studentId: string, score: string) => {
    const newScore = score === "" ? null : Number(score);
    if (newScore !== null && isNaN(newScore)) return;
    if (newScore !== null && newScore < 0) return;

    setScores(prev => ({
        ...prev,
        [studentId]: { score: newScore }
    }));
  };

  const handleSaveScores = async () => {
    if(!selectedExam) return;
    setIsSaving(true);
    try {
        await saveExamScores(selectedExam, scores);
        toast({title: "تم الحفظ", description: "تم حفظ درجات الامتحان بنجاح."});
    } catch (error) {
        toast({title: "خطأ", description: "فشل حفظ الدرجات.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  };

  // Calculate statistics
  const studentScoresArray = enrolledStudents
    .map(s => scores[s.id]?.score)
    .filter((score): score is number => score !== null && score !== undefined);
  
  const hasScores = studentScoresArray.length > 0;
  const average = hasScores ? (studentScoresArray.reduce((a, b) => a + b, 0) / studentScoresArray.length).toFixed(2) : "0";
  const highest = hasScores ? Math.max(...studentScoresArray) : 0;
  const lowest = hasScores ? Math.min(...studentScoresArray) : 0;
  const passCount = studentScoresArray.filter(s => s >= 50).length;
  const passRate = enrolledStudents.length > 0 ? ((passCount / enrolledStudents.length) * 100).toFixed(1) : "0";

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>نتائج الامتحانات</CardTitle>
          <CardDescription>
            اختر الامتحان لعرض وإدخال درجات الطلاب
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الامتحان</Label>
                <Select onValueChange={(value) => {
                  setSelectedExam(value);
                  setSelectedClass("all");
                }} value={selectedExam} disabled={isLoadingExams}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="اختر الامتحان" />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.title} - {exam.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedExam && examClasses.length > 0 && (
                <div className="space-y-2">
                  <Label>الفصل</Label>
                  <Select onValueChange={setSelectedClass} value={selectedClass}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="اختر الفصل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الفصول</SelectItem>
                      {examClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedExam && hasScores && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              الإحصائيات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">المتوسط</p>
                <p className="text-2xl font-bold text-blue-600">{average}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">الأعلى</p>
                <p className="text-2xl font-bold text-green-600">{highest}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">الأقل</p>
                <p className="text-2xl font-bold text-red-600">{lowest}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">النجاح</p>
                <p className="text-2xl font-bold text-emerald-600">{passCount}/{enrolledStudents.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">نسبة النجاح</p>
                <p className="text-2xl font-bold text-indigo-600">{passRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {isLoadingStudents && (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoadingStudents && selectedExam && (
        <Card>
          <CardHeader>
            <CardTitle>{exams.find(e => e.id === selectedExam)?.title} - كشف الدرجات</CardTitle>
            <CardDescription>
              {enrolledStudents.length} طالب {selectedClass !== "all" && `في فصل ${selectedClass}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledStudents.length > 0 ? (
              <div className="space-y-3">
                {enrolledStudents.map((student, idx) => {
                  const studentScore = scores[student.id]?.score;
                  let scoreColor = "text-muted-foreground";
                  if (studentScore !== null && studentScore !== undefined) {
                    if (studentScore >= 80) scoreColor = "text-green-600 font-bold";
                    else if (studentScore >= 50) scoreColor = "text-blue-600 font-bold";
                    else scoreColor = "text-red-600 font-bold";
                  }

                  return (
                    <div key={student.id} className="flex items-center justify-between rounded-md border p-4 hover:bg-muted/50 transition">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{idx + 1}. {student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Input 
                          type="number"
                          min="0"
                          max="100"
                          className="w-20 text-center"
                          placeholder="0"
                          value={scores[student.id]?.score ?? ""}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                        />
                        {studentScore !== null && studentScore !== undefined && (
                          <span className={`text-sm font-semibold w-8 text-right ${scoreColor}`}>
                            {studentScore}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>لا يوجد طلاب في هذا الفصل</p>
              </div>
            )}
            
            {enrolledStudents.length > 0 && (
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" disabled={isSaving}>
                  <Download className="h-4 w-4" />
                  تصدير
                </Button>
                <Button onClick={handleSaveScores} disabled={isSaving} className="btn-gradient btn-click-effect">
                  {isSaving && <Loader2 className="animate-spin" />}
                  {isSaving ? "يتم الحفظ..." : "حفظ الدرجات"}
                  {!isSaving && <Save className="h-4 w-4" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoadingStudents && selectedExam && enrolledStudents.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium">لا يوجد طلاب</h3>
            <p className="text-sm text-muted-foreground mt-2">
              لا يوجد طلاب مسجلين في هذا المقرر أو الفصل المختار.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
