"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { validateParentAccessToken, getParentAccessRecord } from '@/services/parentService';
import { getSupportPrograms, createSupportSignupRequest } from '@/services/supportService';
import { getStudent } from '@/services/studentService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/translation-provider';

export default function ParentSupportSignupPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [programs, setPrograms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

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
        const list = await getSupportPrograms();
        setPrograms(list || []);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('support.fetchError') || 'Failed to load programs.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [token, toast, t]);

  const handleRequest = async (courseId: string) => {
    if (!token) return;
    setRequestingId(courseId);
      try {
      const studentId = await validateParentAccessToken(token);
      if (!studentId) throw new Error('Invalid token');
      const access = await getParentAccessRecord(token);
      const parentName = access?.parentName;
      await createSupportSignupRequest(studentId, courseId, parentName || undefined);
      toast({ title: t('support.requestSentTitle') || 'Request sent', description: t('support.requestSentDesc') || 'Signup request has been sent to the school.' });
    } catch (err) {
      console.error(err);
        toast({ title: t('common.error'), description: t('support.requestError') || 'Failed to submit request.', variant: 'destructive' });
    } finally {
      setRequestingId(null);
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t('support.title')}</h1>
      </header>
      <main>
        <Card>
          <CardHeader>
            <CardTitle>{t('support.availableTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t('common.loading')}</p>
            ) : programs.length === 0 ? (
              <p className="text-muted-foreground">{t('support.noAvailable')}</p>
            ) : (
              <div className="space-y-3">
                {programs.map(p => (
                  <article key={p.id} className="p-3 border rounded-md flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-sm text-muted-foreground">{p.description}</p>
                    </div>
                    <div>
                      <Button size="sm" disabled={requestingId === p.id} onClick={() => void handleRequest(p.id)}>
                        {requestingId === p.id ? t('support.requesting') : t('support.request')}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
