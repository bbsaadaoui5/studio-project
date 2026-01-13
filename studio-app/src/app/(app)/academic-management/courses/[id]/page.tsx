
"use client";

import { notFound, useParams } from "next/navigation";
import { useTranslation } from "@/i18n/translation-provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit, Users, Trash2, Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { getCourse } from "@/services/courseService";
import { Course, Student } from "@/lib/types";
import { getStudents } from "@/services/studentService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseDetailsClient } from "./CourseDetailsClient";
import { Badge } from "@/components/ui/badge";

export default function CourseDetailsPage() {
  const params = useParams();
  const id = params?.id as string;
  // Hooks must always run in the same order — declare them before early returns
  const [course, setCourse] = useState<Course | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

    useEffect(() => {
      if (!id) return;

      const getCourseData = async () => {
        setIsLoading(true);
        try {
          const courseData = await getCourse(id);
          if (!courseData) {
              notFound();
              return;
          }
          setCourse(courseData);
      
          // جلب جميع الطلاب في نفس المستوى الدراسي
          const allStudents = await getStudents();
          const students = allStudents.filter(s => s.grade === courseData.grade);
          setEnrolledStudents(students);

        } catch (error) {
          console.error("لم يكن بالإمكان جلب تفاصيل المقرر:", error);
          // Handle error appropriately, maybe show a toast
        } finally {
          setIsLoading(false);
        }
      }

      getCourseData();
    }, [id]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!course) {
      return notFound();
    }

    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('');
    }

    return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild aria-label={t('common.backToCourses')}>
          <Link href={`/academic-management/courses/grade/${course.grade}`}>
            <ArrowLeft />
            <span className="sr-only">{t('common.backToCourses') || 'العودة إلى المقررات'}</span>
          </Link>
        </Button>
              <h1 className="text-2xl font-bold">تفاصيل المقرر</h1>
          </div>
          <CourseDetailsClient course={course} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
              <Card>
                  <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{course.name}</CardTitle>
                            <CardDescription className="text-lg">يقوم بالتدريس {course.teachers?.[0]?.name || 'لم يتم تحديده'}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-base flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {course.type === 'academic' ? `الصف ${course.grade}` : 'برنامج دعم'}
                        </Badge>
                      </div>
                  </CardHeader>
                  <CardContent className="mt-6">
                      <div className="space-y-6">
                          <div>
                              <h3 className="text-lg font-semibold">الوصف</h3>
                              <Separator className="my-2" />
                              <p className="text-muted-foreground">{course.description}</p>
                          </div>
                          <div>
                              <h3 className="text-lg font-semibold">التفاصيل</h3>
                              <Separator className="my-2" />
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                  <p className="text-muted-foreground">القسم</p>
                                  <p className="font-medium">{course.department}</p>
                                  <p className="text-muted-foreground">الساعات المعتمدة</p>
                                  <p className="font-medium">{course.credits}</p>
                                  <p className="text-muted-foreground">معرّف المقرر</p>
                                  <p className="font-medium">{course.id}</p>
                              </div>
                          </div>
                      </div>
                  </CardContent>
              </Card>
          </div>
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Users />
                      الطلاب المسجلون ({enrolledStudents.length})
                  </CardTitle>
                  <CardDescription>الطلاب الذين يتابعون هذا المقرر حالياً.</CardDescription>
              </CardHeader>
              <CardContent>
                  {enrolledStudents.length > 0 ? (
                      <div className="space-y-4">
                          {enrolledStudents.map(student => (
                              <div key={student.id} className="flex items-center gap-4">
                                  <Avatar className="h-10 w-10">
                                      <AvatarImage src={`https://picsum.photos/seed/${student.id}/100/100`} data-ai-hint="student photo" />
                                      <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="font-medium">{student.name}</p>
                                      <p className="text-sm text-muted-foreground">{student.email}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  ): (
                      <p className="text-sm text-muted-foreground text-center py-8">لا يوجد طلاب مسجلون حالياً في هذا المقرر.</p>
                  )}
              </CardContent>
          </Card>
        </div>
      </div>
    );
}
