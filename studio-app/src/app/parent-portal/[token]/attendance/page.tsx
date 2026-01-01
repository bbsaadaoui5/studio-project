"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { getAttendanceForStudent } from "@/services/attendanceService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/i18n/translation-provider';

export default function ParentAttendancePage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<{ date: string; status: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        const student = await getStudent(studentId);
        if (!student) {
          toast({ title: t('common.error'), description: t('attendance.fetchError') || 'Failed to find student data.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }

        const data = await getAttendanceForStudent(studentId);
        // Sort descending by date
        data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecords(data);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('attendance.fetchError') || 'Failed to load attendance.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [token, toast, t]);

  const exportCsv = () => {
    const header = 'date,status\n';
    const rows = records.map(r => `${r.date},${r.status}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('attendance.pageTitle')}</h1>
        <div>
          <Button onClick={exportCsv} size="sm">{t('attendance.exportCsv')}</Button>
        </div>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>{t('attendance.recordTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t('common.loading')}</p>
            ) : records.length === 0 ? (
              <p className="text-muted-foreground">{t('attendance.noRecords')}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('attendance.columns.date')}</TableHead>
                    <TableHead>{t('attendance.columns.status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(r => (
                    <TableRow key={r.date}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="capitalize">{t(`attendance.status.${r.status}`) || r.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
