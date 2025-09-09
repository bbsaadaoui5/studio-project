
"use client";

import { useEffect, useState }from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getSettings, saveSettings } from "@/services/settingsService";
import { Loader2, Save, Building, Calendar, KeyRound, Landmark } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { FeeStructuresSettings } from "@/components/settings/fee-structures-settings";
import { UserManagementSettings } from "@/components/settings/user-management-settings";
import { AttendanceExamSettings } from "@/components/settings/attendance-exam-settings";

type SettingsTab = "general" | "users" | "finance" | "exams" | "communication" | "system" | "security";

export default function SettingsPage() {
    const { toast } = useToast();
    const [schoolName, setSchoolName] = useState("");
    const [academicYear, setAcademicYear] = useState("");
    const [address, setAddress] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<SettingsTab>("general");

    const settingsMenu = [
        { id: "general", label: "General & Academic", icon: Building, disabled: false },
        { id: "finance", label: "Finance", icon: Landmark, disabled: false },
        { id: "users", label: "User Management", icon: KeyRound, disabled: false },
        { id: "exams", label: "Attendance & Exams", icon: Calendar, disabled: false },
    ]

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            try {
                const currentSettings = await getSettings();
                setSchoolName(currentSettings.schoolName);
                setAcademicYear(currentSettings.academicYear);
                setAddress(currentSettings.address || "");
            } catch (error) {
                toast({ title: "Error", description: "Could not fetch settings data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInitialData();
    }, [toast]);
    
    const handleSaveGeneralSettings = async () => {
        setIsSaving(true);
        try {
            await saveSettings({ schoolName, academicYear, address });
            toast({ title: "Settings Saved", description: "Your changes have been saved."});
        } catch (error) {
            toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
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
                            <CardTitle>General Settings</CardTitle>
                            <CardDescription>Manage global settings for the CampusConnect application.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-48">
                                    <Loader2 className="animate-spin" />
                                </div>
                            ) : (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="school-name">School Name</Label>
                                    <Input id="school-name" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="academic-year">Current Academic Year</Label>
                                    <Input id="academic-year" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="e.g., 2024-2025"/>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="school-address">School Address</Label>
                                    <Textarea id="school-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter the school's physical address"/>
                                </div>

                                <div className="flex justify-end">
                                    <Button onClick={handleSaveGeneralSettings} disabled={isSaving}>
                                        {isSaving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                        {isSaving ? "Saving..." : "Save Settings"}
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
            default:
                return (
                    <Card>
                        <CardHeader>
                            <CardTitle>Coming Soon</CardTitle>
                        </CardHeader>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <p>This settings section is under construction.</p>
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
                        <nav className="flex flex-col gap-1">
                             {settingsMenu.map((item) => (
                                <Button 
                                    key={item.id} 
                                    variant={activeTab === item.id ? "secondary" : "ghost"}
                                    className="justify-start"
                                    onClick={() => setActiveTab(item.id as SettingsTab)}
                                    disabled={item.disabled}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.label}
                                </Button>
                             ))}
                        </nav>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-3">
                {renderContent()}
            </div>
        </div>
    )
}
