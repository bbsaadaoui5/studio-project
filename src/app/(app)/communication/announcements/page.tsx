
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { generateAnnouncement, GenerateAnnouncementOutput } from '@/ai/flows/generate-announcement-flow';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Save, ClipboardCopy } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { addAnnouncement } from '@/services/announcementService';
import { useTranslation } from "@/i18n/translation-provider";

export default function AnnouncementsPage() {
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'teachers' | 'parents' | 'both'>('both');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const [generatedAnnouncement, setGeneratedAnnouncement] = useState<GenerateAnnouncementOutput | null>(null);

  // حذف التوليد بالذكاء الاصطناعي

  const handleSave = async () => {
    if (!topic || !content) {
      toast({
        title: 'خطأ',
        description: 'يرجى إدخال عنوان ونص الإعلان',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(true);
    try {
      await addAnnouncement({ title: topic, content, audience });
      toast({
        title: 'تم الحفظ',
        description: 'تم حفظ الإعلان بنجاح.'
      });
      setTopic('');
      setContent('');
      setAudience('both');
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء الحفظ.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleCopy = () => {
    if (!generatedAnnouncement) return;
    const textToCopy = `Title: ${generatedAnnouncement.title}\n\nContent: ${generatedAnnouncement.content}`;
    navigator.clipboard.writeText(textToCopy);
    toast({
        title: t("communication.copySuccess"),
        description: t("communication.copySuccessDesc"),
    });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>إضافة إعلان جديد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">عنوان الإعلان</Label>
            <Input
              className="glass-input"
              id="topic"
              placeholder="اكتب عنوان الإعلان هنا..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">نص الإعلان</Label>
            <Textarea
              className="glass-input"
              id="content"
              placeholder="اكتب نص الإعلان هنا..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audience">الفئة المستهدفة</Label>
            <select
              id="audience"
              className="glass-input w-full rounded-md border px-3 py-2"
              value={audience}
              onChange={e => setAudience(e.target.value as 'teachers' | 'parents' | 'both')}
            >
              <option value="both">الجميع (المعلمين وأولياء الأمور)</option>
              <option value="teachers">المعلمين فقط</option>
              <option value="parents">أولياء الأمور فقط</option>
            </select>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="btn-gradient btn-click-effect">
            {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
            {isSaving ? 'جاري الحفظ...' : 'حفظ الإعلان'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
