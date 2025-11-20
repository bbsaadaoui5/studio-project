"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/translation-provider';
import { validateParentAccessToken, getParentAccessRecord } from '@/services/parentService';
import { getStudent } from '@/services/studentService';
import { getThreadsForClass, createThread } from '@/services/forumService';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ForumsPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { t } = useTranslation();
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const { toast } = useToast();
  const router = useRouter();

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
      const student = await getStudent(studentId);
      if (!student) {
        setLoading(false);
        return;
      }
      const classKey = `${student.grade || ''}-${student.className || ''}`;
      const items = await getThreadsForClass(classKey);
      if (mounted) setThreads(items);
      setLoading(false);
    }
    load();
    return () => { mounted = false; }
  }, [token, toast, t]);

  const onCreate = async () => {
    if (!title || !content) return toast({ title: t('forums.fillFields') });
    if (!token) return toast({ title: t('unauthorized.title') });
    try {
      const studentId = await validateParentAccessToken(token as string);
      if (!studentId) throw new Error('رمز غير صالح');
  const student = await getStudent(studentId);
  if (!student) throw new Error('الطالب غير موجود');
  const classKey = `${student.grade || ''}-${student.className || ''}`;
      const accessRecord = await getParentAccessRecord(token as string);
      await createThread({ classKey, title, content, author: accessRecord?.parentName || 'ولي الأمر' });
      toast({ title: t('forums.created'), description: t('forums.createdDesc') });
      router.refresh();
    } catch (e) {
      toast({ title: t('common.error'), description: (e as Error).message });
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">{t('forums.title')}</h2>
      <div className="mb-6">
        <input className="border p-2 w-full mb-2" placeholder={t('forums.newThread.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} />
        <textarea className="border p-2 w-full mb-2" rows={4} placeholder={t('forums.newThread.contentPlaceholder')} value={content} onChange={e => setContent(e.target.value)} />
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={onCreate}>{t('forums.postButton')}</button>
        </div>
      </div>

          {loading ? <div>{t('common.loading')}</div> : (
        <div className="space-y-4">
          {threads.length === 0 && <div className="text-muted">لا يوجد مواضيع بعد.</div>}
          {threads.map(t => (
            <div key={t.id} className="border p-3 rounded">
              <a href={`./${t.id}`} className="text-lg font-semibold">{t.title}</a>
              <div className="text-sm text-muted">بواسطة: {t.author || 'ولي الأمر'}</div>
              <p className="mt-2">{t.content?.slice(0, 300)}{t.content && t.content.length > 300 ? '…' : ''}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
