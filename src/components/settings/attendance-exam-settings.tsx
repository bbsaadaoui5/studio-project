
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { Loader2, Save } from "lucide-react";

type GradeRange = {
    mention: string;
    min: number;
    max: number;
};

const initialGradingScale: GradeRange[] = [
    { mention: "Très Bien", min: 16, max: 20 },
    { mention: "Bien", min: 14, max: 15 },
    { mention: "Assez Bien", min: 12, max: 13 },
    { mention: "Passable", min: 10, max: 11 },
    { mention: "Insuffisant", min: 0, max: 9 },
];

export function AttendanceExamSettings() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [gradingScale, setGradingScale] = useState<GradeRange[]>(initialGradingScale);
    const [isSaving, setIsSaving] = useState(false);

    const handleGradeChange = (index: number, field: 'min' | 'max', value: string) => {
        const numericValue = parseInt(value, 10);
        if (isNaN(numericValue)) return;

        const newScale = [...gradingScale];
        newScale[index][field] = numericValue;
        setGradingScale(newScale);
    };

    const handleSaveChanges = () => {
        // TODO: Implement saving logic to Firestore
        setIsSaving(true);
        console.log("Saving grading scale:", gradingScale);
        setTimeout(() => {
            toast({
                title: t('settings.attendanceExams.settingsSaved'),
                description: t('settings.attendanceExams.gradingScaleUpdated'),
            });
            setIsSaving(false);
        }, 1000);
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-right">{t('settings.attendanceExams.title')}</CardTitle>
        <CardDescription className="text-right">
          {t('settings.attendanceExams.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <div>
                        <h3 className="text-lg font-semibold mb-4 text-right">{t('settings.attendanceExams.gradingScale')}</h3>
            <p className="text-sm text-muted-foreground text-right">{t('settings.attendanceExams.defineScoreRanges')}</p>
            <div className="mt-4 space-y-4">
                {gradingScale.map((grade, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <Label className="w-28 text-md font-bold">{grade.mention}</Label>
                        <div className="flex items-center gap-2">
                             <Input 
                                type="number" 
                                value={grade.min} 
                                onChange={(e) => handleGradeChange(index, 'min', e.target.value)}
                                className="w-24"
                                aria-label={`${grade.mention} minimum score`}
                            />
                             <span>-</span>
                              <Input 
                                type="number" 
                                value={grade.max} 
                                onChange={(e) => handleGradeChange(index, 'max', e.target.value)}
                                className="w-24"
                                aria-label={`${grade.mention} maximum score`}
                            />
                            <span className="text-muted-foreground">/ 20</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end">
            <Button onClick={handleSaveChanges} disabled={isSaving} className="text-right">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                {isSaving ? t('common.saving') : t('settings.attendanceExams.saveChanges')}
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
