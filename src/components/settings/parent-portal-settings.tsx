import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Link2 } from "lucide-react";
import { getStudents } from "@/services/studentService";
import { generateParentAccessToken, getParentAccessLink } from "@/services/parentService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";

export function ParentPortalSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [parentLink, setParentLink] = useState<string | null>(null);
  const [parentDisplayName, setParentDisplayName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const studentsData = await getStudents();
        setStudents(studentsData);
      } catch (error) {
        toast({ title: t('common.error'), description: t('settings.parentPortal.couldNotFetchData'), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast, t]);

  const handleGenerateLink = async () => {
    if (!selectedStudentId) return;
    setIsGenerating(true);
    try {
      await generateParentAccessToken(selectedStudentId, { parentName: parentDisplayName || undefined });
      const link = await getParentAccessLink(selectedStudentId);
      setParentLink(link);
      toast({ title: t('common.success'), description: t('settings.parentPortal.linkGenerated') });
    } catch (error) {
      toast({ title: t('common.error'), description: t('settings.parentPortal.failedToGenerateLink'), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (parentLink) {
      navigator.clipboard.writeText(parentLink);
      toast({ title: t('settings.parentPortal.copied'), description: t('settings.parentPortal.linkCopied') });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">{t('settings.parentPortal.linkGenerator')}</CardTitle>
        <CardDescription className="text-right">{t('settings.parentPortal.linkGeneratorDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="student-select" className="text-right">{t('settings.parentPortal.selectStudent')}</Label>
              <select
                id="student-select"
                className="w-full border rounded px-3 py-2 text-right"
                value={selectedStudentId}
                onChange={e => {
                  setSelectedStudentId(e.target.value);
                  setParentLink(null);
                }}
              >
                <option value="">{t('settings.parentPortal.selectStudentOption')}</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.grade} - {s.className})</option>
                ))}
              </select>
              <div className="mt-2">
                <Label htmlFor="parent-name" className="text-right">{t('settings.parentPortal.parentName') || 'اسم ولي الأمر (اختياري)'}</Label>
                <Input id="parent-name" value={parentDisplayName} onChange={e => setParentDisplayName(e.target.value)} placeholder="مثال: فاطمة محمد" />
              </div>
            </div>
            <Button onClick={handleGenerateLink} disabled={!selectedStudentId || isGenerating} className="text-right">
              {isGenerating ? <Loader2 className="animate-spin ml-2" /> : <Link2 className="ml-2" />}
              {isGenerating ? t('settings.parentPortal.generating') : t('settings.parentPortal.generateRefreshLink')}
            </Button>
            {parentLink && (
              <div className="flex flex-col gap-2 mt-4">
                <div className="font-medium text-right">
                  {t('settings.parentPortal.selectedStudent')}: {students.find(s => s.id === selectedStudentId)?.name || ''}
                </div>
                <div className="flex items-center gap-2">
                  <Input value={parentLink || ''} readOnly className="flex-1" />
                  <Button variant="outline" onClick={handleCopy} className="text-right"><Copy className="ml-1 h-4 w-4" />{t('common.copy')}</Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ParentPortalSettings;
