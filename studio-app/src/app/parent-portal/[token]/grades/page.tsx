"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCoursesForStudent } from "@/services/enrollmentService";
import { getCourse } from "@/services/courseService";
import { getStudent } from "@/services/studentService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type SeriesPoint = { courseName: string; percent: number };

export default function ParentGradesPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [data, setData] = useState<SeriesPoint[]>([]);
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
        const points: SeriesPoint[] = [];

        for (const cid of courseIds) {
          const course = await getCourse(cid);
          const percent = await getStudentGradeForCourse(cid, studentId);
          if (course) {
            points.push({ courseName: course.name, percent: percent ?? 0 });
          }
        }

        setData(points);
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

  return (
    <div className="min-h-screen">
      <header className="mb-6">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{t('grades.title')}</h1>
          <div className="flex gap-2">
            <Button onClick={handlePrint}>{t('grades.downloadPdf')}</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('grades.chartTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t('common.loading')}</p>
            ) : data.length === 0 ? (
              <p className="text-muted-foreground">{t('common.noData')}</p>
            ) : (
              <div style={{ width: "100%", height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="courseName" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(val: number) => `${val.toFixed(1)}%`} />
                    <Bar dataKey="percent" fill="#2563EB" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
