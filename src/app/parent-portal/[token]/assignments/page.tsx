"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCoursesForStudent } from "@/services/enrollmentService";
import { getCourse } from "@/services/courseService";
import { getAssignmentsForCourse } from "@/services/gradeService";
import { validateParentAccessToken } from "@/services/parentService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import type { Assignment, Course } from "@/lib/types";

export default function ParentAssignmentsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const params = useParams();
  const token = params?.token as string | undefined;

  const [isLoading, setIsLoading] = useState(true);
  const [assignments, setAssignments] = useState<Array<Assignment & { courseName?: string }>>([]);
  const [studentName, setStudentName] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
        try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: "destructive" });
          return;
        }

        // Get enrolled courses
        const courseIds = await getCoursesForStudent(studentId);
        const coursePromises = courseIds.map(async (cid) => {
          const c = await getCourse(cid);
          return c as Course | null;
        });
        const courses = (await Promise.all(coursePromises)).filter(Boolean) as Course[];

        // Gather assignments per course
        let allAssignments: Array<Assignment & { courseName?: string }> = [];
        for (const course of courses) {
          const asg = await getAssignmentsForCourse(course.id);
          const mapped = asg.map(a => ({ ...a, courseName: course.name }));
          allAssignments = allAssignments.concat(mapped);
        }

        // Sort by dueDate (soonest first), then by name
        allAssignments.sort((a, b) => {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          if (da === db) return a.name.localeCompare(b.name);
          return da - db;
        });
        setAssignments(allAssignments);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error') || 'خطأ', description: t('assignments.fetchError') || 'تعذر جلب الواجبات.', variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast, t]);

  return (
    <div className="min-h-screen">
      <header className="mb-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('assignments.pageTitle') || 'الواجبات'}</h1>
          <div className="flex gap-2">
            <Link href={`../${token}/calendar`}>
              <Button variant="outline">{t('nav.calendar') || 'التقويم'}</Button>
            </Link>
            <Link href={`/communication/messages?withStudentId=${token ?? ''}`}>
              <Button>{t('nav.messages') || 'الرسائل'}</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('assignments.cardTitle') || 'قائمة الواجبات'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t('loading.checkingLink') || 'جاري التحميل...'}</p>
            ) : assignments.length === 0 ? (
              <p className="text-muted-foreground">{t('assignments.empty') || 'لا توجد واجبات حالياً.'}</p>
            ) : (
              <div className="space-y-3">
                {assignments.map(a => (
                  <div key={a.id} className="p-3 border rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{a.name}</p>
                      <p className="text-sm text-muted-foreground">{t('assignments.courseLabel', { courseName: a.courseName })}</p>
                    </div>
                    <div className="text-sm text-right">
                      <div>{t('assignments.pointsLabel', { points: a.totalPoints })}</div>
                      {a.dueDate ? (
                        <div className="text-xs text-muted-foreground">{t('assignments.dueLabel', { date: new Date(a.dueDate).toLocaleDateString('ar-EG') })}</div>
                      ) : (
                        <div className="text-xs text-muted-foreground">{t('assignments.noDue') || 'لا يوجد موعد نهائي'}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
