
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Save } from "lucide-react";
import { Exam, Student, ExamScore } from "@/lib/types";
import { getExams } from "@/services/examService";
import { useToast } from "@/hooks/use-toast";
import { getEnrollmentForCourse } from "@/services/enrollmentService";
import { getStudent } from "@/services/studentService";
import { saveExamScores, getExamScores } from "@/services/gradeService";
import { Input } from "@/components/ui/input";

export default function ExamResultsPage() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, { score: number | null }>>({});

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
      return;
    }

    const fetchStudentsAndScores = async () => {
      setIsLoadingStudents(true);
      try {
        const examDetails = exams.find(e => e.id === selectedExam);
        if (!examDetails) return;

        const enrollment = await getEnrollmentForCourse(examDetails.courseId);
        if (enrollment && enrollment.studentIds.length > 0) {
          const studentPromises = enrollment.studentIds.map(id => getStudent(id));
          const students = await Promise.all(studentPromises);
          setEnrolledStudents(students.filter(s => s) as Student[]);
        } else {
            setEnrolledStudents([]);
        }

        const scoreData = await getExamScores(selectedExam);
        setScores(scoreData?.studentScores || {});

      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch students or scores.", variant: "destructive" });
        setEnrolledStudents([]);
        setScores({});
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudentsAndScores();
  }, [selectedExam, exams, toast]);
  
  const handleScoreChange = (studentId: string, score: string) => {
    const newScore = score === "" ? null : Number(score);
    if (newScore !== null && isNaN(newScore)) return;

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
        toast({title: "Scores Saved", description: "The exam scores have been successfully saved."});
    } catch (error) {
        toast({title: "Error", description: "Failed to save scores.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>نتائج الامتحانات</CardTitle>
          <CardDescription>
            اختر الامتحان لعرض أو إدخال درجات الطلاب.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-w-md">
            <Label>اختر الامتحان</Label>
            <Select onValueChange={setSelectedExam} value={selectedExam} disabled={isLoadingExams}>
              <SelectTrigger>
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
        </CardContent>
      </Card>
      
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
           أدخل درجات كل طالب.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {enrolledStudents.map(student => (
            <div key={student.id} className="flex items-center justify-between rounded-md border p-4">
              <p className="font-medium">{student.name}</p>
              <Input 
                type="text"
                className="w-24"
                placeholder="الدرجة"
                value={scores[student.id]?.score ?? ""}
                onChange={(e) => handleScoreChange(student.id, e.target.value)}
              />
            </div>
          ))}
        </div>
         <div className="flex justify-end mt-6">
          <Button onClick={handleSaveScores} disabled={isSaving}>
            {isSaving && <Loader2 className="animate-spin" />}
            {isSaving ? "...يتم الحفظ" : "حفظ الدرجات"}
            {!isSaving && <Save />}
          </Button>
        </div>
      </CardContent>
    </Card>
      )}

      {!isLoadingStudents && selectedExam && enrolledStudents.length === 0 && (
     <Card>
      <CardContent className="py-12 text-center">
        <h3 className="text-lg font-medium">لا يوجد طلاب مسجلين</h3>
        <p className="text-sm text-muted-foreground mt-2">
          قم بتسجيل الطلاب في هذا المقرر لإدخال نتائج الامتحان.
        </p>
      </CardContent>
    </Card>
      )}
    </div>
  );
}
