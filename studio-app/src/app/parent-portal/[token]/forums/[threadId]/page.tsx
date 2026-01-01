"use client";
import React, { useEffect, useState } from 'react';
import { validateParentAccessToken, getParentAccessRecord } from '@/services/parentService';
import { getStudent } from '@/services/studentService';
import { getThread, addReply, flagItem } from '@/services/forumService';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/translation-provider';

export default function ThreadPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const threadId = params?.threadId as string | undefined;
  const [thread, setThread] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      if (!token || !threadId) return setLoading(false);
      const studentId = await validateParentAccessToken(token);
      if (!studentId) {
        toast({ title: t('unauthorized.title') });
        setLoading(false);
        return;
      }
      const student = await getStudent(studentId);
      if (!student) {
        setLoading(false);
        return;
      }
      const data = await getThread(threadId!);
      if (mounted) setThread(data);
      setLoading(false);
    }
    load();
    return () => { mounted = false; }
  }, [token, threadId, toast, t]);

  const onReply = async () => {
    if (!reply) return toast({ title: t('forums.replyEmpty') });
    try {
      const accessRecord = await getParentAccessRecord(token as string);
    await addReply(threadId!, reply, accessRecord?.parentName || t('forums.authorFallback'));
      toast({ title: t('forums.replyAddedTitle'), description: t('forums.replyAddedDesc') });
      setReply('');
      router.refresh();
    } catch (e) {
      toast({ title: t('common.error'), description: (e as Error).message });
    }
  }

  const onFlag = async (path: string) => {
    try {
      await flagItem(path);
      toast({ title: t('forums.reported') });
      router.refresh();
    } catch (e) {
      toast({ title: t('common.error'), description: (e as Error).message });
    }
  }

  if (loading) return <div className="p-4">{t('common.loading')}</div>;
  if (!thread) return <div className="p-4">{t('forums.threadNotFound')}</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-2">{thread.title}</h2>
      <div className="text-sm text-muted">{t('forums.by', { author: thread.author || t('forums.authorFallback') })}</div>
      <div className="mt-4 border p-3 rounded">{thread.content}</div>
      <div className="mt-4">
  <h3 className="text-lg">{t('forums.repliesTitle')}</h3>
        <div className="space-y-3 mt-3">
          {thread.replies?.length === 0 && <div className="text-muted">{t('forums.noReplies')}</div>}
          {thread.replies?.map((r: any) => (
            <div key={r.id} className="border p-2 rounded">
              <div className="text-sm font-semibold">{r.author || t('forums.authorFallback')}</div>
              <div className="mt-1">{r.content}</div>
                <div className="mt-2 flex gap-2">
                <button className="text-sm text-red-600" onClick={() => onFlag(`classForums/${thread.id}/replies/${r.id}`)}>{t('forums.reportButton')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <textarea className="border p-2 w-full" rows={3} value={reply} onChange={e => setReply(e.target.value)} placeholder={t('forums.replyPlaceholder')} />
        <div className="mt-2">
          <button className="btn btn-primary" onClick={onReply}>{t('forums.postReplyButton')}</button>
          <button className="ml-2 text-sm text-red-600" onClick={() => onFlag(`classForums/${thread.id}`)}>{t('forums.reportButton')}</button>
        </div>
      </div>
    </div>
  )
}
