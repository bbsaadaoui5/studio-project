"use client";
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/i18n/translation-provider';
import { useParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { validateParentAccessToken, getParentAccessRecord } from '@/services/parentService';
import { getStudent } from '@/services/studentService';
import { addGoal, getGoalsForStudent, addProgressEntry, updateGoal } from '@/services/goalService';

export default function GoalsPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [goals, setGoals] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);

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
        const list = await getGoalsForStudent(studentId);
        if (mounted) setGoals(list);
      } catch (e) {
        toast({ title: 'خطأ', description: 'تعذر جلب الأهداف.' });
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; }
  }, [token, toast, t]);

  const onCreate = async () => {
  if (!token) return toast({ title: t('unauthorized.title') });
  if (!title) return toast({ title: t('goals.titleRequired') });
    setSaving(true);
    try {
      const studentId = await validateParentAccessToken(token as string);
      if (!studentId) throw new Error('رمز غير صالح');
      const id = await addGoal(studentId, { title, notes, targetDate, status: 'active' });
  toast({ title: t('common.success'), description: t('goals.added') });
      const list = await getGoalsForStudent(studentId);
      setGoals(list);
      setTitle(''); setNotes(''); setTargetDate('');
    } catch (e) {
      toast({ title: 'خطأ', description: (e as Error).message });
    } finally { setSaving(false); }
  }

  const onAddProgress = async (goalId: string) => {
    const percentRaw = prompt('نسبة التقدم (0-100)');
  if (!percentRaw) return;
    const percent = Number(percentRaw);
  if (isNaN(percent) || percent < 0 || percent > 100) return toast({ title: t('goals.invalidValue') });
  const note = prompt(t('goals.prompt.note')) || '';
    try {
      await addProgressEntry(goalId, { percent, note });
  toast({ title: t('common.success'), description: t('goals.progressRecorded') });
      // refresh
      if (token) {
        const studentId = await validateParentAccessToken(token as string);
        const list = await getGoalsForStudent(studentId as string);
        setGoals(list);
      }
    } catch (e) {
      toast({ title: 'خطأ', description: (e as Error).message });
    }
  }

  const onComplete = async (goalId: string) => {
    try {
      await updateGoal(goalId, { status: 'completed' });
  toast({ title: t('common.success'), description: t('goals.completed') });
      if (token) {
        const studentId = await validateParentAccessToken(token as string);
        const list = await getGoalsForStudent(studentId as string);
        setGoals(list);
      }
    } catch (e) {
  toast({ title: t('common.error'), description: (e as Error).message });
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">{t('goals.title')}</h2>
      <div className="mb-4 border p-3 rounded">
        <div className="mb-2"><Input placeholder={t('goals.titlePlaceholder')} value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="mb-2"><Input placeholder={t('goals.notesPlaceholder')} value={notes} onChange={e => setNotes(e.target.value)} /></div>
        <div className="mb-2"><Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} /></div>
        <div><Button onClick={onCreate} disabled={saving}>{saving ? t('goals.savingLabel') : t('goals.addButton')}</Button></div>
      </div>

      {loading ? <div>{t('common.loading')}</div> : (
        <div className="space-y-4">
          {goals.length === 0 && <div className="text-muted">{t('goals.noGoals')}</div>}
          {goals.map(g => (
            <div key={g.id} className="border p-3 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{g.title}</div>
                  {g.notes && <div className="text-sm text-muted">{g.notes}</div>}
                  {g.targetDate && <div className="text-sm">{t('goals.targetLabel')} {new Date(g.targetDate).toLocaleDateString('ar-EG')}</div>}
                </div>
                <div className="text-right">
                  <div className="text-sm">{t('goals.statusLabel')}: {g.status}</div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" onClick={() => onAddProgress(g.id)}>{t('goals.addProgress')}</Button>
                    {g.status !== 'completed' && <Button size="sm" variant="outline" onClick={() => onComplete(g.id)}>{t('goals.markCompleted')}</Button>}
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <h4 className="font-medium">{t('goals.progressHeader')}</h4>
                <div className="space-y-2 mt-2">
                  {(g.progress || []).length === 0 && <div className="text-muted">{t('goals.noProgress')}</div>}
                  {(g.progress || []).map((p: any, idx: number) => (
                    <div key={idx} className="text-sm border p-2 rounded">
                      <div>{t('goals.percentLabel')}: {p.percent ?? '-'}%</div>
                      {p.note && <div className="text-xs text-muted">{p.note}</div>}
                      <div className="text-xs text-muted">{new Date(p.createdAt).toLocaleString('ar-EG')}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
