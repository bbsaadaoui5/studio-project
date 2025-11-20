"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/translation-provider';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { validateParentAccessToken, getParentAccessRecord } from '@/services/parentService';
import { getStudent } from '@/services/studentService';
import { getClubs, createClubSignupRequest } from '@/services/clubService';
import { Button } from '@/components/ui/button';

export default function ClubsPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [clubs, setClubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      if (!token) return setLoading(false);
      const studentId = await validateParentAccessToken(token);
      if (!studentId) {
        toast({ title: t('unauthorized.title'), description: t('unauthorized.description') });
        setLoading(false);
        return;
      }
      try {
        const list = await getClubs();
        if (mounted) setClubs(list);
      } catch (e) {
        toast({ title: t('common.error'), description: t('clubs.fetchError') });
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; }
  }, [token, toast, t]);

  const onRequest = async (courseId: string) => {
    if (!token) return toast({ title: t('unauthorized.title'), description: t('unauthorized.description') });
    setRequesting(courseId);
    try {
      const studentId = await validateParentAccessToken(token as string);
  if (!studentId) throw new Error(t('unauthorized.title'));
      const accessRecord = await getParentAccessRecord(token as string);
      await createClubSignupRequest(studentId, courseId, accessRecord?.parentName || undefined);
  toast({ title: t('clubs.joinRequested'), description: t('clubs.joinRequestedDesc') });
    } catch (e) {
      toast({ title: t('common.error'), description: (e as Error).message });
    } finally {
      setRequesting(null);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">{t('clubs.title')}</h2>
      {loading ? <div>{t('common.loading')}</div> : (
        <div className="space-y-4">
          {clubs.length === 0 && <div className="text-muted">{t('clubs.noAvailable')}</div>}
          {clubs.map(c => (
            <div key={c.id} className="border p-3 rounded flex justify-between items-start">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-sm text-muted">{c.description}</div>
                {c.schedule && <div className="text-sm mt-2">{t('clubs.scheduleLabel', { schedule: c.schedule })}</div>}
              </div>
              <div>
                <Button onClick={() => onRequest(c.id)} disabled={requesting === c.id}>{requesting === c.id ? t('clubs.requestingLabel') : t('clubs.joinButton')}</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
