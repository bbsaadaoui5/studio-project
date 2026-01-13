"use client";

import React, { useEffect, useState } from "react";
import { useTranslation } from '@/i18n/translation-provider';
import { useParams, notFound } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { validateParentAccessToken } from "@/services/parentService";
import { getCourse } from "@/services/courseService";
import { getStaffMember } from "@/services/staffService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { getStudent } from "@/services/studentService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function ParentCoursePage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const courseId = params?.id as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<any | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [studentId, setStudentId] = useState<string>("");
  const [finalGrade, setFinalGrade] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token || !courseId) return;
      setIsLoading(true);
      try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: "destructive" });
          return;
        }
        
        setStudentId(studentId);
        console.log('📚 Loading course details for:', courseId, 'Student:', studentId);

        const c = await getCourse(courseId);
  if (!c) return notFound();
        setCourse(c);
        console.log('✅ Course loaded:', c.name);

        // Fetch student's final grade for this course
        const grade = await getStudentGradeForCourse(courseId, studentId);
        setFinalGrade(grade);
        console.log('📊 Student grade for this course:', grade ?? 'غير متوفر');

        // fetch teacher contact info when available
        const teacherPromises = (c.teachers || []).map((teacherInfo: any) => getStaffMember(teacherInfo.id));
        const teacherResults = await Promise.all(teacherPromises);
        setTeachers(teacherResults.filter(Boolean));
      } catch (err) {
        console.error(err);
  toast({ title: t('common.error'), description: t('courses.fetchError') || 'Failed to fetch course data.', variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, courseId, toast, t]);

  if (isLoading) return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <Card>
        <CardContent>{t('courses.notFound')}</CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
  <h1 className="text-2xl font-semibold">{t('courses.infoTitle')}: {course.name}</h1>
        <div className="flex gap-2">
          <Link href={`../..`}>
            <Button variant="outline">العودة</Button>
          </Link>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الدرجة النهائية</CardTitle>
            </CardHeader>
            <CardContent>
              {finalGrade !== null ? (
                <div className="flex items-center gap-4">
                  <div className={`text-4xl font-bold ${finalGrade >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {finalGrade.toFixed(1)}%
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full ${finalGrade >= 50 ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${Math.min(finalGrade, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {finalGrade >= 90 ? 'ممتاز' : 
                       finalGrade >= 80 ? 'جيد جداً' : 
                       finalGrade >= 70 ? 'جيد' : 
                       finalGrade >= 60 ? 'مقبول' : 
                       finalGrade >= 50 ? 'نجح' : 'راسب'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">لا توجد درجة متوفرة حالياً</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{t('courses.descriptionTitle')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{course.description || t('courses.noDescription')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('courses.resourcesTitle')}</CardTitle>
              <CardDescription>{t('courses.resourcesDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {/* If teacher-provided resources pages exist, link to them; otherwise show placeholder */}
              {teachers.length > 0 ? (
                <ul className="space-y-2">
                  {teachers.map(teacher => (
                    <li key={teacher.id} className="p-2 border rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-sm text-muted-foreground">{teacher.position || 'Teacher'}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Link href={`/teacher/portal/${teacher.id}/resources`} className="text-sm text-primary">{t('courses.viewResources')}</Link>
                          {teacher.email && <a className="text-xs text-muted-foreground">{teacher.email}</a>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t('courses.noResources')}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('courses.quickDetails')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>{t('courses.gradeLabel')}:</strong> {course.grade}</p>
              <p><strong>{t('courses.credits')}:</strong> {course.credits ?? 'N/A'}</p>
              <p><strong>{t('courses.departmentLabel')}:</strong> {course.department || t('common.department') || 'General'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('courses.contactTeacher')}</CardTitle>
            </CardHeader>
            <CardContent>
              {teachers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('courses.noTeacherAssigned')}</p>
              ) : (
                <div className="space-y-3">
                  {teachers.map(teacher => (
                    <div key={teacher.id} className="p-2 border rounded">
                      <p className="font-medium">{teacher.name}</p>
                      {teacher.email && <p className="text-sm text-muted-foreground">البريد الإلكتروني: {teacher.email}</p>}
                      {teacher.phone && <p className="text-sm text-muted-foreground">الهاتف: {teacher.phone}</p>}
                      <div className="mt-2">
                        <Link href={`/teacher/portal/${teacher.id}`}>
                          <Button size="sm">{t('courses.viewTeacherProfile')}</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );
}
