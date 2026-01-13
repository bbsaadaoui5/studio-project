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
import { Loader2, PlusCircle, Save, BarChart3, Download, Search, ArrowUpDown } from "lucide-react";
import { Course, Student, Assignment } from "@/lib/types";
import { getCourses } from "@/services/courseService";
import { useToast } from "@/hooks/use-toast";
import { getEnrollmentForCourse, enrollStudentsInCourse } from "@/services/enrollmentService";
import { getStudent, getStudents } from "@/services/studentService";
import { getAssignmentsForCourse, addAssignment, saveGrades, getGrades } from "@/services/gradeService";
import { getStaffMember } from "@/services/staffService";
import { Input } from "@/components/ui/input";
import { auth } from "@/lib/firebase-client";
import { onAuthStateChanged } from "firebase/auth";
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
  const [gradeOptions, setGradeOptions] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [grades, setGrades] = useState<Record<string, { score: number | null }>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"name" | "score">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  
  // Role-based states
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");

  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentType, setNewAssignmentType] = useState<string>("homework");
  const [newAssignmentPoints, setNewAssignmentPoints] = useState(100);
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState<string | null>(null);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check current user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const staffMember = await getStaffMember(user.uid);
          setCurrentUserRole(staffMember?.role || null);
        } catch (error) {
          console.error("فشل في جلب دور المستخدم:", error);
        }
      }
      setIsLoadingRole(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);

        // اجمع جميع المستويات لإتاحة الاختيار للإدارة
        const uniqueGrades = Array.from(new Set(fetchedCourses.map(c => String(c.grade)))).sort();
        setGradeOptions(uniqueGrades);
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
      const opts = Array.from(new Set(allStudents.filter(s => s.grade === course.grade).map(s => `${s.grade}-${s.className}`))).sort();
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
            students = allStudents.filter(s => {
              const studentClassId = `${s.grade}-${s.className}`;
              return s.grade === course.grade && (selectedClass === "all" || studentClassId === selectedClass);
            });
          }
        }

        const filteredStudents = selectedClass === "all" 
          ? students 
          : students.filter((s: any) => {
              const studentClassId = `${s.grade}-${s.className}`;
              return studentClassId === selectedClass;
            });

        setEnrolledStudents(filteredStudents);

        const gradeData = await getGrades(selectedAssignment);
        console.log('🔍 GRADEBOOK LOADING ASSIGNMENT GRADES:');
        console.log('📝 Assignment ID:', selectedAssignment);
        console.log('👥 Enrolled students:', enrolledStudents.map(s => ({ name: s.name, id: s.id, studentId: s.studentId })));
        console.log('📊 Grade data loaded from DB:', gradeData?.studentGrades);
        console.log('🎯 Keys in gradeData:', Object.keys(gradeData?.studentGrades || {}));
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
          toast({title: "خطأ", description: "المقرر واسم الواجب مطلوبان.", variant: "destructive"});
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
          toast({ title: "خطأ", description: "فشل إنشاء الواجب.", variant: "destructive" });
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
        console.log('💾 SAVING ASSIGNMENT GRADES:');
        console.log('📝 Assignment ID:', selectedAssignment);
        console.log('👥 Students being saved:', enrolledStudents.map(s => ({ name: s.name, id: s.id, studentId: s.studentId })));
        console.log('📊 Grades object keys:', Object.keys(grades));
        console.log('📊 Full grades object:', grades);
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

  // Get filtered courses based on role
  const filteredCourses = currentUserRole === 'admin' && selectedGrade
    ? courses.filter(c => String(c.grade) === selectedGrade)
    : currentUserRole === 'teacher'
    ? courses.filter(c => c.teachers?.some(t => t.name)) // المعلم يرى مقررات تدرسها
    : courses;
  const filteredStudents = enrolledStudents.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc" 
        ? a.name.localeCompare(b.name, 'ar')
        : b.name.localeCompare(a.name, 'ar');
    } else {
      const scoreA = grades[a.id]?.score ?? -1;
      const scoreB = grades[b.id]?.score ?? -1;
      return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
    }
  });

  // Calculate individual student average
  const getStudentAverage = (studentId: string) => {
    const studentGrades = assignments
      .map(a => grades[`${studentId}_${a.id}`]?.score || (grades[studentId]?.score ?? null))
      .filter((score): score is number => score !== null && score !== undefined);
    
    if (studentGrades.length === 0) return null;
    return (studentGrades.reduce((a, b) => a + b, 0) / studentGrades.length).toFixed(1);
  };

  // Export to CSV
  const handleExportGrades = () => {
    if (!selectedAssignment || !assignment) return;
    
    let csv = "اسم الطالب,معرّف الطالب,الدرجة,النسبة المئوية\n";
    
    sortedStudents.forEach(student => {
      const score = grades[student.id]?.score ?? "-";
      const pct = score !== "-" ? ((Number(score) / maxPoints) * 100).toFixed(1) : "-";
      csv += `"${student.name}","${student.studentId}","${score}","${pct}%"\n`;
    });
    
    const element = document.createElement("a");
    const file = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    element.href = URL.createObjectURL(file);
    element.download = `${assignment.name}_${new Date().toISOString().split('T')[0]}.csv`;
    element.click();
    
    toast({ title: "تم التصدير", description: "تم تصدير الدرجات بنجاح" });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>دفتر الدرجات</CardTitle>
          <CardDescription>
            {currentUserRole === 'admin' 
              ? 'إدارة شاملة للدرجات حسب المستوى الدراسي'
              : 'إدارة درجات مقررك'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Grade Selection for Admin */}
            {currentUserRole === 'admin' && gradeOptions.length > 0 && (
              <div className="space-y-2">
                <Label>المستوى الدراسي</Label>
                <Select onValueChange={(value) => {
                  setSelectedGrade(value);
                  setSelectedCourse("");
                  setSelectedClass("all");
                }} value={selectedGrade}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="اختر المستوى الدراسي" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeOptions.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        الصف {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>المقرر</Label>
              <Select onValueChange={(value) => {
                setSelectedCourse(value);
                setSelectedClass("all");
              }} value={selectedCourse} disabled={isLoadingCourses || (currentUserRole === 'admin' && !selectedGrade)}>
                <SelectTrigger className="glass-input">
                  <SelectValue placeholder="اختر المقرر" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCourses.map((course) => (
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
              <Label>الواجب</Label>
              <div className="flex gap-2">
                <Select onValueChange={setSelectedAssignment} value={selectedAssignment} disabled={!selectedCourse || isLoadingAssignments}>
                  <SelectTrigger className="glass-input">
                    <SelectValue placeholder="اختر الواجب" />
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
                    <Button variant="outline" size="icon" disabled={!selectedCourse} title="إضافة واجب جديد">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>إنشاء واجب جديد</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل الواجب للمقرر: {filteredCourses.find(c => c.id === selectedCourse)?.name}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label>نوع الواجب</Label>
                        <Select value={newAssignmentType} onValueChange={setNewAssignmentType}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر نوع الواجب" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="homework">الواجب المنزلي</SelectItem>
                            <SelectItem value="classwork">الواجب الدراسي</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>اسم الواجب</Label>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{assignment?.name} - إدخال الدرجات</CardTitle>
                <CardDescription>
                  {enrolledStudents.length} طالب {selectedClass !== "all" && `في فصل ${selectedClass}`}
                </CardDescription>
              </div>
              <Button onClick={handleExportGrades} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                تصدير CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search and Sort Section */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="ابحث عن الطالب باسمه أو معرّفه..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm"
                  />
                </div>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="الفرز حسب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">الاسم</SelectItem>
                    <SelectItem value="score">الدرجة</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  title={sortOrder === "asc" ? "تصاعدي" : "تنازلي"}
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Students List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {sortedStudents.map((student, idx) => {
                  const studentScore = grades[student.id]?.score;
                  const scorePercentage = studentScore !== null && studentScore !== undefined 
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
                        <div className="w-16 text-right">
                          {studentScore !== null && studentScore !== undefined && (
                            <div>
                              <p className="text-sm font-semibold">{studentScore}</p>
                              <p className="text-xs text-muted-foreground">{scorePercentage}%</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">لم يتم العثور على طلاب مطابقين للبحث</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={handleExportGrades}>
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
              اختر الفصل لتحميل قائمة الطلاب وتسجيلهم في المقرر.
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
