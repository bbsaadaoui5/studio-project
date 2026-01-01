"use client";

import { useEffect, useState, useCallback }from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getSettings, saveSettings } from "@/services/settingsService";
import { Loader2, Save, Building, Calendar, KeyRound, Landmark } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FeeStructuresSettings } from "@/components/settings/fee-structures-settings";
import { UserManagementSettings } from "@/components/settings/user-management-settings";
import { AttendanceExamSettings } from "@/components/settings/attendance-exam-settings";
import { ParentPortalSettings } from "@/components/settings/parent-portal-settings";

type SettingsTab = "general" | "users" | "finance" | "exams" | "communication" | "system" | "security" | "parent-portal";

export default function SettingsPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [schoolName, setSchoolName] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [address, setAddress] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    const settingsMenu = [
        { id: "general", label: t("settings.generalAcademic"), icon: Building, disabled: false },
        { id: "finance", label: t("settings.finance"), icon: Landmark, disabled: false },
        { id: "users", label: t("settings.userManagement.title"), icon: KeyRound, disabled: false },
        { id: "exams", label: t("settings.attendanceExams.title"), icon: Calendar, disabled: false },
        { id: "parent-portal", label: t("settings.parentPortalTitle"), icon: KeyRound, disabled: false },
    ]

    // Ensure UI uses Arabic by default (disable pseudo-localization test mode)
    useEffect(() => {
        try {
            localStorage.setItem('test-language', 'ar');
        } catch (e) {
            // ignore in environments without localStorage
        }
    }, []);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentSettings = await getSettings();
            setSchoolName(currentSettings.schoolName);
            setAcademicYear(currentSettings.academicYear);
            setAddress(currentSettings.address || "");
        } catch (error) {
            toast({ title: t("common.error"), description: t("settings.errorFetchingSettings"), variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, t]);

    useEffect(() => {
        void fetchInitialData();
    }, [fetchInitialData]);
    
    const handleSaveGeneralSettings = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ schoolName, academicYear, address });
            toast({ title: t('settings.settingsSaved'), description: t('settings.changesSaved')});
        } catch (error) {
            toast({ title: t('common.error'), description: t('settings.failedToSaveSettings'), variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }
    
    const renderContent = () => {
        switch (activeTab) {
            case "general":
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('settings.generalSettingsTitle')}</CardTitle>
                            <CardDescription>{t('settings.generalSettingsDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="animate-spin" />
                                </div>
                            ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="school-name" className="text-right">{t('settings.schoolName')}</Label>
                                    <Input id="school-name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="text-right" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="academic-year" className="text-right">{t('settings.currentAcademicYear')}</Label>
                                    <Input id="academic-year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder={t('settings.academicYearPlaceholder')} className="text-right"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school-address" className="text-right">{t('settings.schoolAddress')}</Label>
                                    <Textarea id="school-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('settings.schoolAddressPlaceholder')} className="text-right"/>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveGeneralSettings} disabled={isSaving} className="text-right">
                                        {isSaving ? <Loader2 className="animate-spin ml-2" /> : <Save className="ml-2" />}
                                        {isSaving ? t('settings.saving') : t('settings.saveSettings')}
                                    </Button>
                                </div>
                            </>
                            )}
                        </CardContent>
                    </Card>
                );
            case "finance":
                return <FeeStructuresSettings />;
            case "users":
                 return <UserManagementSettings />;
            case "exams":
                return <AttendanceExamSettings />;
                        case "parent-portal":
                                    return <ParentPortalSettings />;
            default:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-right">{t('settings.comingSoon')}</CardTitle>
                        </CardHeader>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <p className="text-right">{t('settings.sectionUnderConstruction')}</p>
                        </CardContent>
                    </Card>
                );
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
                 <Card>
                    <CardContent className="p-2">
                        <nav aria-label={t('settings.navigation') || 'إعدادات'} className="flex flex-col gap-1">
                             {settingsMenu.map((item) => (
                                <Button 
                                    key={item.id} 
                                    variant={activeTab === item.id ? "secondary" : "ghost"}
                                    className="justify-start text-right"
                                    onClick={() => setActiveTab(item.id as SettingsTab)}
                                    disabled={item.disabled}
                                >
                                    <item.icon className="ml-2 h-4 w-4" />
                                    {item.label}
                                </Button>
                             ))}
                        </nav>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-3">
                {/* Page-level heading to preserve heading order for accessibility
                    (h1 exists at root; add an h2 so subsequent h3 CardTitle does
                    not skip levels). Use an sr-only heading so visual layout
                    remains unchanged. */}
                <h2 className="sr-only">{t('settings.title') || 'الإعدادات'}</h2>
                {renderContent()}
            </div>
        </div>
    )
}
