
"use client";

import { notFound, useParams } from "next/navigation";
import { useTranslation } from "@/i18n/translation-provider";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { getCourse } from "@/services/courseService";
import { Course, Student } from "@/lib/types";
import { getEnrollmentForCourse } from "@/services/enrollmentService";
import { getStudent } from "@/services/studentService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseDetailsClient } from "@/app/(app)/academic-management/courses/[id]/CourseDetailsClient";
import { Badge } from "@/components/ui/badge";

export default function SupportCourseDetailsPage() {
  const { t } = useTranslation();
    const params = useParams();
    const id = params?.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Hooks before early return
    useEffect(() => {
      if (!id) return;

      const getCourseData = async () => {
        setIsLoading(true);
        try {
          const courseData = await getCourse(id);
          if (!courseData || courseData.type !== 'support') {
              notFound();
              return;
          }
          setCourse(courseData);
      
          const enrollment = await getEnrollmentForCourse(id);
          let students: Student[] = [];
          if (enrollment && enrollment.studentIds.length > 0) {
            const studentPromises = enrollment.studentIds.map(sid => getStudent(sid));
            const studentResults = await Promise.all(studentPromises);
            students = studentResults.filter(s => s !== null) as Student[];
          }
          setEnrolledStudents(students);

        } catch (error) {
          console.error("Could not fetch course details:", error);
        } finally {
          setIsLoading(false);
        }
      }

      getCourseData();
    }, [id]);

    if (!id) { return <div>ID not found</div>; }

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
        <Button variant="outline" size="icon" asChild>
            <Link href="/support-programs/courses">
            <ArrowLeft />
            <span className="sr-only">{t('common.back') || 'Back'}</span>
            </Link>
        </Button>
  <h1 className="text-2xl font-bold">تفاصيل المقرر</h1>
          </div>
          <div className="flex gap-2">
          <Link href={`/support-programs/courses/${id}/edit`}>
            <Button variant="secondary" className="btn-glass-primary">تعديل المقرر</Button>
          </Link>
          <Button variant="destructive" className="btn-glass-primary" onClick={() => {
            if (confirm('هل أنت متأكد أنك تريد حذف هذا المقرر؟ لا يمكن التراجع عن هذه العملية.')) {
              // TODO: تنفيذ حذف المقرر من خلال API أو خدمة الحذف
              alert('تم حذف المقرر (تنفيذ الحذف الفعلي مطلوب)');
            }
          }}>
            حذف
          </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
              <Card>
                  <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{course.name}</CardTitle>
                            <CardDescription className="text-lg">الأستاذ: {course.teachers && course.teachers.length > 0 ? course.teachers[0].name : ''}</CardDescription>
                        </div>
                        <Badge variant="secondary" className="text-base flex items-center gap-2">
                 القسم: {course.department}
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
                      </div>
                  </CardContent>
              </Card>
          </div>
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users />
            الطلاب ({enrolledStudents.length})
          </CardTitle>
          <CardDescription>دليل الطلاب</CardDescription>
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
            <p className="text-sm text-muted-foreground text-center py-8">لا يوجد طلاب مسجلين في هذا المقرر</p>
          )}
              </CardContent>
          </Card>
        </div>
      </div>
    );
}
