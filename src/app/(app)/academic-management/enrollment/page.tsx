
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Course, Student } from "@/lib/types";
import { getCourses } from "@/services/courseService";
import { getStudents } from "@/services/studentService";
import { enrollStudentsInCourse, getEnrollmentForCourse, enrollStudentInCourses, getCoursesForStudent } from "@/services/enrollmentService";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "@/i18n/translation-provider";

export default function EnrollmentPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for "Enroll by Course"
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedStudentsForCourse, setSelectedStudentsForCourse] = useState<string[]>([]);
  
  // State for "Enroll by Student"
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCoursesForStudent, setSelectedCoursesForStudent] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedCourses, fetchedStudents] = await Promise.all([
          getCourses(),
          getStudents(),
        ]);
        setCourses(fetchedCourses);
        setStudents(fetchedStudents.filter(s => s.status === 'active'));
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("academics.failedToFetchInitialData"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, t]);

  // Effect for "Enroll by Course"
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!selectedCourse) {
          setSelectedStudentsForCourse([]);
          return;
      };
      setIsLoading(true);
      try {
        const enrollment = await getEnrollmentForCourse(selectedCourse);
        setSelectedStudentsForCourse(enrollment?.studentIds || []);
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("academics.failedToFetchEnrollmentData"),
          variant: "destructive",
        });
        setSelectedStudentsForCourse([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrollmentData();
  }, [selectedCourse, toast, t]);

  // Effect for "Enroll by Student"
  useEffect(() => {
    const fetchStudentCourses = async () => {
        if (!selectedStudent) {
            setSelectedCoursesForStudent([]);
            return;
        }
        setIsLoading(true);
        try {
            const courseIds = await getCoursesForStudent(selectedStudent.id);
            setSelectedCoursesForStudent(courseIds);
        } catch (error) {
            toast({
              title: "Error",
              description: "Failed to fetch course data for the selected student.",
              variant: "destructive",
            });
            setSelectedCoursesForStudent([]);
        } finally {
            setIsLoading(false);
        }
    };
    fetchStudentCourses();
  }, [selectedStudent, toast, t]);


  const handleStudentSelectionForCourse = (studentId: string) => {
    setSelectedStudentsForCourse((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  const handleCourseSelectionForStudent = (courseId: string) => {
    setSelectedCoursesForStudent((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAllStudents = () => {
      const activeStudentIds = students.map(s => s.id);
      if (selectedStudentsForCourse.length === activeStudentIds.length) {
          setSelectedStudentsForCourse([]);
      } else {
          setSelectedStudentsForCourse(activeStudentIds);
      }
  }

  async function handleEnrollByCourse() {
    if (!selectedCourse) {
      toast({ title: t("academics.pleaseSelectCourse"), variant: "destructive" });
      return;
    }
   
    setIsSaving(true);
    try {
      await enrollStudentsInCourse(selectedCourse, selectedStudentsForCourse);
      toast({
        title: t("academics.enrollmentUpdated"),
        description: `${t("academics.studentEnrollmentUpdated")} ${courses.find(c=>c.id === selectedCourse)?.name}.`,
      });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("academics.failedToUpdateEnrollment"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEnrollByStudent() {
    if (!selectedStudent) {
      toast({ title: t("academics.pleaseSelectStudent"), variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
        await enrollStudentInCourses(selectedStudent.id, selectedCoursesForStudent);
        toast({
            title: t("academics.enrollmentUpdated"),
            description: `${t("academics.courseEnrollmentUpdated")} ${selectedStudent.name}.`,
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to update enrollment. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleSelectStudent = (studentId: string) => {
      const student = students.find(s => s.id === studentId) || null;
      setSelectedStudent(student);
  }

  const coursesForStudentGrade = courses.filter(c => c.grade === selectedStudent?.grade);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>تسجيل الطلاب في المقررات</CardTitle>
          <CardDescription>
            إدارة تسجيل الطلاب في المقررات الدراسية حسب الصف أو الطالب
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="by-course">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="by-course">تسجيل حسب المقرر</TabsTrigger>
                    <TabsTrigger value="by-student">تسجيل حسب الطالب</TabsTrigger>
                </TabsList>
                <TabsContent value="by-course" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>اختر المقرر</Label>
                            <Select onValueChange={setSelectedCourse} value={selectedCourse} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="اختر المقرر لإدارته" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name} (المستوى {course.grade}) - {Array.isArray(course.teachers) && course.teachers.length > 0 ? course.teachers.map(t => t.name).join(', ') : 'لا يوجد معلم'}
                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                         {selectedCourse && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>اختر الطلاب</CardTitle>
                                    <CardDescription>حدد الطلاب الذين تريد تسجيلهم في هذا المقرر</CardDescription>
                                    <div className="flex items-center space-x-2 pt-4">
                                        <Checkbox 
                                            id="select-all-students" 
                                            onCheckedChange={handleSelectAllStudents}
                                            checked={students.length > 0 && selectedStudentsForCourse.length === students.length}
                                        />
                                        <Label htmlFor="select-all-students">تحديد كل الطلاب</Label>
                                    </div>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-4">
                                    <ScrollArea className="h-72">
                                        <div className="space-y-4">
                                        {students.map((student) => (
                                            <div key={student.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`student-for-course-${student.id}`}
                                                checked={selectedStudentsForCourse.includes(student.id)}
                                                onCheckedChange={() => handleStudentSelectionForCourse(student.id)}
                                            />
                                            <Label htmlFor={`student-for-course-${student.id}`} className="flex-1 cursor-pointer">
                                                <div className="flex justify-between">
                                                    <span>{student.name}</span>
                                                    <span className="text-muted-foreground text-sm">المستوى {student.grade}، القسم {student.className}</span>
                                                </div>
                                            </Label>
                                            </div>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                         )}
                    </div>
                     <div className="flex justify-end mt-4">
            <Button onClick={handleEnrollByCourse} disabled={!selectedCourse || isSaving || isLoading}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              حفظ التغييرات
            </Button>
                    </div>
                </TabsContent>
                <TabsContent value="by-student" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <Label>اختر الطالب</Label>
                            <Select onValueChange={handleSelectStudent} value={selectedStudent?.id || ""} disabled={isLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الطالب لإدارته" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.name} (المستوى {student.grade} - {student.className})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedStudent && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>اختر المقررات للمستوى {selectedStudent.grade}</CardTitle>
                                    <CardDescription>حدد المقررات التي تريد تسجيل {selectedStudent.name} فيها.</CardDescription>
                                </CardHeader>
                                 <Separator />
                                <CardContent className="pt-4">
                                     <ScrollArea className="h-72">
                                        <div className="space-y-4">
                                        {coursesForStudentGrade.length > 0 ? coursesForStudentGrade.map((course) => (
                                            <div key={course.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`course-for-student-${course.id}`}
                                                checked={selectedCoursesForStudent.includes(course.id)}
                                                onCheckedChange={() => handleCourseSelectionForStudent(course.id)}
                                            />
                                            <Label htmlFor={`course-for-student-${course.id}`} className="flex-1 cursor-pointer">
                                                <div className="flex justify-between">
                                                    <span>{course.name}</span>
                                                    <span className="text-muted-foreground text-sm">{course.department} - {Array.isArray(course.teachers) && course.teachers.length > 0 ? course.teachers.map(t => t.name).join(', ') : 'لا يوجد معلم'}</span>
                                                </div>
                                            </Label>
                                            </div>
                                        )) : <p className="text-center text-muted-foreground py-4">لا توجد مقررات لهذا المستوى {selectedStudent.grade}.</p>}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                     <div className="flex justify-end mt-4">
            <Button onClick={handleEnrollByStudent} disabled={!selectedStudent || isSaving || isLoading}>
              {isSaving ? <Loader2 className="animate-spin" /> : null}
              حفظ التغييرات
            </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
