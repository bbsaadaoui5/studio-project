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
import { Loader2, PlusCircle, Save, BarChart3, Download } from "lucide-react";
import { Course, Student, Assignment } from "@/lib/types";
import { getCourses } from "@/services/courseService";
import { useToast } from "@/hooks/use-toast";
import { getEnrollmentForCourse, enrollStudentsInCourse } from "@/services/enrollmentService";
import { getStudent, getStudents } from "@/services/studentService";
import { getAssignmentsForCourse, addAssignment, saveGrades, getGrades } from "@/services/gradeService";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function GradebookPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [grades, setGrades] = useState<Record<string, { score: number | null }>>({});

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");

  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentPoints, setNewAssignmentPoints] = useState(100);
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState<string | null>(null);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل جلب المقررات.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [toast]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const list = await getStudents();
        setAllStudents(list);
      } catch (e) {
        // ignore
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setAssignments([]);
      setSelectedAssignment("");
      setClassOptions([]);
      setSelectedClass("all");
      return;
    }
    const fetchAssignments = async () => {
      setIsLoadingAssignments(true);
      try {
        const fetchedAssignments = await getAssignmentsForCourse(selectedCourse);
        setAssignments(fetchedAssignments);
      } catch (error) {
        toast({ title: "خطأ", description: "فشل جلب التكاليف.", variant: "destructive" });
      } finally {
        setIsLoadingAssignments(false);
      }
    };
    fetchAssignments();

    const course = courses.find(c => c.id === selectedCourse);
    if (course) {
      const opts = Array.from(new Set(allStudents.filter(s => s.grade === course.grade).map(s => s.className))).sort();
      setClassOptions(opts);
      setSelectedClass("all");
    }
  }, [selectedCourse, toast, courses, allStudents]);

  useEffect(() => {
    if (!selectedCourse || !selectedAssignment) {
      setEnrolledStudents([]);
      setGrades({});
      return;
    }

    const fetchStudentsAndGrades = async () => {
      setIsLoadingStudents(true);
      try {
        const enrollment = await getEnrollmentForCourse(selectedCourse);
        let students: Student[] = [];
        
        if (enrollment && enrollment.studentIds.length > 0) {
          const studentPromises = enrollment.studentIds.map(id => getStudent(id));
          students = (await Promise.all(studentPromises)).filter(s => s) as Student[];
        } else {
          const course = courses.find(c => c.id === selectedCourse);
          if (course) {
            students = allStudents.filter(s => s.grade === course.grade && (selectedClass === "all" || s.className === selectedClass));
          }
        }

        const filteredStudents = selectedClass === "all" 
          ? students 
          : students.filter((s: any) => s.className === selectedClass);

        setEnrolledStudents(filteredStudents);

        const gradeData = await getGrades(selectedAssignment);
        setGrades(gradeData?.studentGrades || {});

      } catch (error) {
        toast({ title: "خطأ", description: "فشل جلب الطلاب أو الدرجات.", variant: "destructive" });
        setEnrolledStudents([]);
        setGrades({});
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudentsAndGrades();
  }, [selectedCourse, selectedAssignment, selectedClass, toast, courses, allStudents]);

  const persistEnrollmentFromPreview = async () => {
    if (!selectedCourse || enrolledStudents.length === 0) return;
    setIsSaving(true);
    try {
      await enrollStudentsInCourse(selectedCourse, enrolledStudents.map(s => s.id));
      toast({ title: "تم التسجيل", description: "تم تسجيل التلاميذ في المقرر." });
    } catch (e) {
      toast({ title: "خطأ", description: "فشل التسجيل.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAssignment = async () => {
      if (!selectedCourse || !newAssignmentName) {
          toast({title: "خطأ", description: "المقرر واسم التكليف مطلوبان.", variant: "destructive"});
          return;
      }
      setIsCreatingAssignment(true);
      try {
      const newAssignment = {
        courseId: selectedCourse,
        name: newAssignmentName,
        totalPoints: newAssignmentPoints,
        dueDate: newAssignmentDueDate || undefined,
      }
      const assignmentId = await addAssignment(newAssignment);
      setAssignments(prev => [...prev, { ...newAssignment, id: assignmentId }]);
      setSelectedAssignment(assignmentId);
      toast({ title: "تم الإنشاء", description: `تم إنشاء "${newAssignmentName}".`});
      setNewAssignmentName("");
      setNewAssignmentPoints(100);
      setNewAssignmentDueDate(null);
      setIsDialogOpen(false);
      } catch (error) {
          toast({ title: "خطأ", description: "فشل إنشاء التكليف.", variant: "destructive" });
      } finally {
          setIsCreatingAssignment(false);
      }
  }
  
  const handleGradeChange = (studentId: string, score: string) => {
    const newScore = score === "" ? null : Number(score);
    if (newScore !== null && isNaN(newScore)) return;
    if (newScore !== null && newScore < 0) return;

    setGrades(prev => ({
        ...prev,
        [studentId]: { score: newScore }
    }));
  };

  const handleSaveGrades = async () => {
    if(!selectedAssignment) return;
    setIsSaving(true);
    try {
        await saveGrades(selectedAssignment, grades);
        toast({title: "تم الحفظ", description: "تم حفظ الدرجات بنجاح."});
    } catch (error) {
        toast({title: "خطأ", description: "فشل حفظ الدرجات.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }

  // Calculate statistics
  const studentGradesArray = enrolledStudents
    .map(s => grades[s.id]?.score)
    .filter((score): score is number => score !== null && score !== undefined);
  
  const hasGrades = studentGradesArray.length > 0;
  const assignment = assignments.find(a => a.id === selectedAssignment);
  const maxPoints = assignment?.totalPoints || 100;
  const average = hasGrades ? (studentGradesArray.reduce((a, b) => a + b, 0) / studentGradesArray.length).toFixed(1) : "0";
  const percentage = hasGrades ? ((parseFloat(average) / maxPoints) * 100).toFixed(1) : "0";
  const highest = hasGrades ? Math.max(...studentGradesArray) : 0;
  const lowest = hasGrades ? Math.min(...studentGradesArray) : 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>دفتر الدرجات</CardTitle>
          <CardDescription>
            إدارة شاملة للدرجات والتكاليف لكل مقرر
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>المقرر</Label>
              <Select onValueChange={(value) => {
                setSelectedCourse(value);
                setSelectedClass("all");
              }} value={selectedCourse} disabled={isLoadingCourses}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="اختر المقرر" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedCourse && classOptions.length > 0 && (
              <div className="space-y-2">
                <Label>الفصل</Label>
                <Select onValueChange={setSelectedClass} value={selectedClass}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الفصول</SelectItem>
                    {classOptions.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>التكليف</Label>
              <div className="flex gap-2">
                <Select onValueChange={setSelectedAssignment} value={selectedAssignment} disabled={!selectedCourse || isLoadingAssignments}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="اختر التكليف" />
                  </SelectTrigger>
                  <SelectContent>
                    {assignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={!selectedCourse} title="إضافة تكليف جديد">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء تكليف جديد</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل التكليف للمقرر: {courses.find(c => c.id === selectedCourse)?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>اسم التكليف</Label>
                        <Input value={newAssignmentName} onChange={e => setNewAssignmentName(e.target.value)} placeholder="مثال: الواجب الأول" />
                      </div>
                      <div className="space-y-2">
                        <Label>النقاط الكلية</Label>
                        <Input type="number" value={newAssignmentPoints} onChange={e => setNewAssignmentPoints(Number(e.target.value))} min="1" />
                      </div>
                      <div className="space-y-2">
                        <Label>تاريخ الاستحقاق</Label>
                        <Input type="date" value={newAssignmentDueDate ?? ""} onChange={e => setNewAssignmentDueDate(e.target.value || null)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleCreateAssignment} disabled={isCreatingAssignment} className="btn-gradient btn-click-effect">
                        {isCreatingAssignment && <Loader2 className="animate-spin" />}
                        إنشاء
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedAssignment && hasGrades && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              إحصائيات الدرجات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-muted-foreground font-semibold">المتوسط</p>
                <p className="text-2xl font-bold text-blue-600">{average}</p>
                <p className="text-xs text-muted-foreground">{percentage}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">الأعلى</p>
                <p className="text-2xl font-bold text-green-600">{highest}</p>
                <p className="text-xs text-muted-foreground">من {maxPoints}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">الأقل</p>
                <p className="text-2xl font-bold text-red-600">{lowest}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">عدد الدرجات</p>
                <p className="text-2xl font-bold text-purple-600">{studentGradesArray.length}</p>
                <p className="text-xs text-muted-foreground">من {enrolledStudents.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-semibold">النقاط الكلية</p>
                <p className="text-2xl font-bold text-indigo-600">{maxPoints}</p>
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

      {!isLoadingStudents && selectedCourse && selectedAssignment && enrolledStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{assignment?.name} - إدخال الدرجات</CardTitle>
            <CardDescription>
              {enrolledStudents.length} طالب {selectedClass !== "all" && `في فصل ${selectedClass}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {enrolledStudents.map((student, idx) => {
                const studentScore = grades[student.id]?.score;
                const percentage = studentScore !== null && studentScore !== undefined 
                  ? ((studentScore / maxPoints) * 100).toFixed(0)
                  : null;

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
                        max={maxPoints}
                        className="w-20 text-center"
                        placeholder="0"
                        value={grades[student.id]?.score ?? ""}
                        onChange={(e) => handleGradeChange(student.id, e.target.value)}
                      />
                      <div className="w-12 text-right">
                        {studentScore !== null && studentScore !== undefined && (
                          <div>
                            <p className="text-sm font-semibold">{studentScore}</p>
                            <p className="text-xs text-muted-foreground">{percentage}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" disabled>
                <Download className="h-4 w-4" />
                تصدير
              </Button>
              <Button onClick={handleSaveGrades} disabled={isSaving} className="btn-gradient btn-click-effect">
                {isSaving && <Loader2 className="animate-spin" />}
                {isSaving ? "يتم الحفظ..." : "حفظ الدرجات"}
                {!isSaving && <Save className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!isLoadingStudents && selectedCourse && enrolledStudents.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <h3 className="text-lg font-medium mb-3">لا يوجد طلاب مسجلين</h3>
            <p className="text-sm text-muted-foreground mb-4">
              حسب النظام المغربي: اختر الفصل لتحميل لائحة القسم وتسجيل الطلاب في المقرر.
            </p>
            {classOptions.length > 0 && (
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px]">
                  <Label className="mb-2 block">اختر الفصل</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="glass-input">
                      <SelectValue placeholder="اختر الفصل" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الأقسام</SelectItem>
                      {classOptions.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={persistEnrollmentFromPreview} disabled={isSaving || enrolledStudents.length === 0} className="btn-gradient btn-click-effect">
                  {isSaving && <Loader2 className="animate-spin" />}
                  تسجيل الطلاب
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
