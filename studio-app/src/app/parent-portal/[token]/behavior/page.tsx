"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { getConductNotesForStudent, calculateConductSummary, type ConductNote, type ConductSummary } from "@/services/conductService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/i18n/translation-provider';
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function ParentBehaviorPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [conductNotes, setConductNotes] = useState<ConductNote[]>([]);
  const [conductSummary, setConductSummary] = useState<ConductSummary | null>(null);

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
          toast({ title: t('common.error'), description: t('common.error') || 'Failed to find student data.', variant: 'destructive' });
          setIsLoading(false);
          return;
        }

        const notes = await getConductNotesForStudent(studentId);
        notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setConductNotes(notes);

        const summary = await calculateConductSummary(studentId);
        setConductSummary(summary);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('common.error') || 'Failed to load behavior notes.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [token, toast, t]);

  const getRatingColor = (type: string) => {
    switch (type) {
      case 'positive':
        return 'bg-green-100 text-green-800';
      case 'negative':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'negative':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'positive':
        return t('conduct.positive') || 'إيجابي';
      case 'negative':
        return t('conduct.negative') || 'سلبي';
      default:
        return t('conduct.neutral') || 'محايد';
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="bg-background border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-2xl font-semibold">{t('conduct.pageTitle') || 'السلوك والانضباط'}</h1>
        </div>
      </header>
      <main className="container mx-auto p-4">
        {/* Summary Cards */}
        {conductSummary && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {t('conduct.overallRating') || 'التقييم العام'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={`${
                  conductSummary.overallRating === 'ممتاز' ? 'bg-green-500' :
                  conductSummary.overallRating === 'جيد' ? 'bg-blue-500' :
                  conductSummary.overallRating === 'متوسط' ? 'bg-yellow-500' :
                  'bg-red-500'
                } text-white text-lg py-1 px-3`}>
                  {conductSummary.overallRating}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {t('conduct.positive') || 'إيجابي'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {conductSummary.positiveCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  {t('conduct.negative') || 'سلبي'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {conductSummary.negativeCount}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t('conduct.total') || 'إجمالي الملاحظات'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {conductSummary.totalNotes}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Conduct Notes */}
        <Card>
          <CardHeader>
            <CardTitle>{t('conduct.recordTitle') || 'سجل السلوك'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t('common.loading')}</p>
            ) : conductNotes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('conduct.noRecords') || 'لا توجد ملاحظات سلوك بعد.'}</p>
            ) : (
              <div className="space-y-3">
                {conductNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      note.type === 'positive'
                        ? 'border-l-green-500 bg-green-50'
                        : note.type === 'negative'
                        ? 'border-l-red-500 bg-red-50'
                        : 'border-l-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(note.type)}
                        <Badge className={getRatingColor(note.type)}>
                          {getTypeLabel(note.type)}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(note.date), 'PPP', { locale: ar })}
                      </span>
                    </div>
                    <p className="text-sm font-medium mb-1">{note.note}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('conduct.by') || 'من قبل'}: {note.teacherName}
                    </p>
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
