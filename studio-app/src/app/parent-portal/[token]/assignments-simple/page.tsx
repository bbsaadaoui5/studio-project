"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCoursesForStudent } from "@/services/enrollmentService";
import { getCourse } from "@/services/courseService";
import { getAssignmentsForCourse, getGrades } from "@/services/gradeService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { Loader2, ChevronLeft, BookOpen } from "lucide-react";

type CourseData = {
  id: string;
  name: string;
  teacherName?: string;
};

type AssignmentWithGrade = {
  id: string;
  name: string;
  score: number | null;
  totalPoints: number;
  percent: number;
};

export default function AssignmentsSimplePage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [courses, setCourses] = useState<CourseData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseData | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithGrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);

  // تحميل المواد
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const { validateParentAccessToken } = await import("@/services/parentService");
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: "غير مصرح", description: "الرمز غير صحيح أو منتهي الصلاحية", variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const courseIds = await getCoursesForStudent(studentId);
        console.log('🔍 PARENT PORTAL - Student ID:', studentId);
        console.log('📚 PARENT PORTAL - Course IDs from enrollment:', courseIds);
        
        const coursesList: CourseData[] = [];
        for (const cid of courseIds) {
          console.log('🔎 Fetching course with ID:', cid);
          const course = await getCourse(cid);
          if (!course) {
            console.warn('⚠️ Course not found for ID:', cid, '- Skipping this course');
          } else {
            console.log('✅ Course found:', course.name, 'ID:', cid);
            coursesList.push({ id: cid, name: course.name, teacherName: course.teachers?.[0]?.name });
          }
        }

        console.log('📋 PARENT PORTAL - Final courses list:', coursesList);
        setCourses(coursesList);
      } catch (err) {
        console.error(err);
        toast({ title: "خطأ", description: "حدث خطأ في تحميل المواد", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast]);

  // تحميل الواجبات عند اختيار مادة
  const loadAssignments = async (course: CourseData) => {
    setSelectedCourse(course);
    setIsLoadingAssignments(true);
    try {
      const { validateParentAccessToken } = await import("@/services/parentService");
      const studentId = await validateParentAccessToken(token!);
      console.log('🔍 Parent Portal Debug - Student ID:', studentId);
      console.log('🔍 Parent Portal Debug - Course:', course.name, course.id);
      
      const assignmentsList = await getAssignmentsForCourse(course.id);
      console.log('🔍 Parent Portal Debug - Assignments found:', assignmentsList.length, assignmentsList);
      
      const assignmentsWithGrades: AssignmentWithGrade[] = await Promise.all(
        assignmentsList.map(async (assignment) => {
          const gradeData = await getGrades(assignment.id);
          console.log('🔍 Parent Portal Debug - Grade data for', assignment.name, ':', gradeData);
          const score = gradeData?.studentGrades?.[studentId]?.score ?? null;
          const percent = score !== null && assignment.totalPoints
            ? Math.round((score / assignment.totalPoints) * 100)
            : 0;
          
          console.log('🔍 Parent Portal Debug - Student score for', assignment.name, ':', score, '/', assignment.totalPoints, '=', percent + '%');
          
          return {
            id: assignment.id,
            name: assignment.name,
            score,
            totalPoints: assignment.totalPoints,
            percent,
          };
        })
      );

      setAssignments(assignmentsWithGrades);
    } catch (err) {
      console.error('❌ Parent Portal Error:', err);
      toast({ title: "خطأ", description: "فشل في تحميل الواجبات", variant: "destructive" });
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* قائمة المواد */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              المواد الدراسية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {courses.length === 0 ? (
              <p className="text-muted-foreground text-sm">لا توجد مواد متاحة</p>
            ) : (
              courses.map((course) => (
                <Button
                  key={course.id}
                  variant={selectedCourse?.id === course.id ? "default" : "outline"}
                  className="w-full justify-start h-auto py-3 px-3 flex-col items-start"
                  onClick={() => loadAssignments(course)}
                >
                  <span className="font-semibold">{course.name}</span>
                  {course.teacherName && (
                    <span className="text-xs text-muted-foreground">{course.teacherName}</span>
                  )}
                </Button>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* تفاصيل المادة والواجبات */}
      <div className="lg:col-span-2">
        {!selectedCourse ? (
          <Card className="flex items-center justify-center min-h-[400px]">
            <CardContent className="text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">اختر مادة لعرض الواجبات والدرجات</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedCourse.name}</CardTitle>
                  {selectedCourse.teacherName && (
                    <p className="text-sm text-muted-foreground mt-1">المعلم: {selectedCourse.teacherName}</p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {isLoadingAssignments ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-center text-muted-foreground">لا توجد واجبات حتى الآن</p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{assignment.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {assignment.score !== null ? `${assignment.score}/${assignment.totalPoints}` : "لم يتم إدخال الدرجة"}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {assignment.percent}%
                        </div>
                        <div className={`text-xs font-medium ${
                          assignment.percent >= 80 ? "text-green-600" : 
                          assignment.percent >= 60 ? "text-yellow-600" : 
                          "text-red-600"
                        }`}>
                          {assignment.percent >= 80 ? "ممتاز" : 
                           assignment.percent >= 60 ? "جيد" : 
                           "يحتاج تحسين"}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* ملخص المادة */}
                  <div className="mt-6 p-4 bg-muted rounded-lg border">
                    <p className="text-sm font-semibold mb-2">المعدل العام للمادة:</p>
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(assignments.reduce((sum, a) => sum + a.percent, 0) / assignments.length)}%
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
