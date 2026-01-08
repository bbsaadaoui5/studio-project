"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCoursesForStudent } from "@/services/enrollmentService";
import { getCourse } from "@/services/courseService";
import { getStudent } from "@/services/studentService";
import { getAssignmentsForCourse, getGrades, getStudentGradeForCourse } from "@/services/gradeService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from "recharts";

type AssignmentPoint = { id: string; name: string; percent: number | null; dueDate?: string };
type GradeCard = {
  courseId: string;
  courseName: string;
  percent: number;
  status: "excellent" | "good" | "needs";
  lastUpdate?: string;
  assignments: AssignmentPoint[];
};

export default function ParentGradesPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [grades, setGrades] = useState<GradeCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        // validate token to get studentId
        // parentService.validateParentAccessToken is used in other pages; import lazily to avoid circulars
        const { validateParentAccessToken } = await import("@/services/parentService");
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const courseIds = await getCoursesForStudent(studentId);

        const cards: GradeCard[] = await Promise.all(
          courseIds.map(async (cid) => {
            const course = await getCourse(cid);
            if (!course) return null;

            const assignments = await getAssignmentsForCourse(cid);
            const assignmentPoints: AssignmentPoint[] = await Promise.all(
              assignments.map(async (assignment) => {
                const gradeData = await getGrades(assignment.id);
                const score = gradeData?.studentGrades?.[studentId]?.score ?? null;
                const percent = score !== null && assignment.totalPoints
                  ? (score / assignment.totalPoints) * 100
                  : null;
                return {
                  id: assignment.id,
                  name: assignment.name,
                  percent,
                  dueDate: assignment.dueDate,
                };
              })
            );

            const overallPercent = (await getStudentGradeForCourse(cid, studentId)) ?? 0;
            const status: GradeCard["status"] = overallPercent >= 85 ? "excellent" : overallPercent >= 70 ? "good" : "needs";
            const lastUpdate = assignmentPoints
              .map((a) => a.dueDate)
              .filter(Boolean)
              .sort()
              .at(-1);

            return {
              courseId: cid,
              courseName: course.name,
              percent: overallPercent,
              status,
              lastUpdate,
              assignments: assignmentPoints,
            };
          })
        ).then((arr) => arr.filter(Boolean) as GradeCard[]);

        setGrades(cards);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('grades.fetchError') || 'Failed to load grades data.', variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast, t]);

  const handlePrint = () => {
    // Simple PDF export: use print; user can save as PDF in browser
    window.print();
  };

  const avgPercent = useMemo(() => {
    if (grades.length === 0) return 0;
    const sum = grades.reduce((acc, g) => acc + g.percent, 0);
    return Math.round((sum / grades.length) * 10) / 10;
  }, [grades]);

  const statusBadge = (status: GradeCard["status"]) => {
    switch (status) {
      case "excellent":
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-800">ممتاز</span>;
      case "good":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">جيد</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-800">يحتاج متابعة</span>;
    }
  };

  const formatDate = (iso?: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("ar-EG", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen">
      <header className="mb-6">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t('grades.title')}</p>
            <h1 className="text-2xl font-semibold">لوحة نتائج الطالب</h1>
          </div>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>{t('grades.downloadPdf')}</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">المعدل العام</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgPercent}%</p>
              <p className="text-sm text-muted-foreground mt-1">متوسط كل المواد</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">مقارنة المواد</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>{t('common.loading')}</p>
              ) : grades.length === 0 ? (
                <p className="text-muted-foreground">{t('common.noData')}</p>
              ) : (
                <div style={{ width: "100%", height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={grades} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="courseName" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
                      <Bar dataKey="percent" fill="#2563EB" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {isLoading ? (
            <Card className="h-48"><CardContent className="pt-6">{t('common.loading')}</CardContent></Card>
          ) : grades.length === 0 ? (
            <p className="text-muted-foreground">{t('common.noData')}</p>
          ) : (
            grades.map((course) => {
              const trend = course.assignments.filter((a) => a.percent !== null).slice(-5);
              return (
                <Card key={course.courseId} className="flex flex-col">
                  <CardHeader className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-base font-semibold">{course.courseName}</CardTitle>
                      {statusBadge(course.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">آخر تحديث: {course.lastUpdate ? formatDate(course.lastUpdate) : '—'}</p>
                  </CardHeader>
                  <CardContent className="space-y-3 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">{course.percent.toFixed(1)}%</span>
                      <span className="text-sm text-muted-foreground">المجموع الكلي</span>
                    </div>

                    {/* coefficient removed */}

                    <div className="h-24">
                      {trend.length === 0 ? (
                        <p className="text-sm text-muted-foreground">لا توجد تقييمات مسجلة بعد</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                            <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} labelFormatter={() => "التقييم"} />
                            <Line type="monotone" dataKey="percent" stroke="#2563EB" strokeWidth={2} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold">أحدث التقييمات</p>
                      {course.assignments.length === 0 ? (
                        <p className="text-sm text-muted-foreground">لا توجد تقييمات</p>
                      ) : (
                        <div className="space-y-2 max-h-32 overflow-auto pr-1">
                          {course.assignments.slice(-4).reverse().map((a) => (
                            <div key={a.id} className="flex items-center justify-between rounded border px-2 py-1 text-sm">
                              <div>
                                <p className="font-medium">{a.name}</p>
                                <p className="text-xs text-muted-foreground">{a.dueDate ? formatDate(a.dueDate) : 'بدون تاريخ'}</p>
                              </div>
                              <span className="font-semibold">{a.percent !== null ? `${a.percent.toFixed(1)}%` : '—'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
