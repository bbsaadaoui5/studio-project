"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Users,
    BookOpenCheck,
    Briefcase,
    TrendingUp,
    Calendar,
    PieChart,
    BarChart,
    Loader2,
    Bell,
    AlertCircle,
    Eye,
    AlertTriangle,
} from "lucide-react";
import { StudentEnrollmentChart } from "@/components/charts/student-enrollment-chart";
import { StudentClassDistributionChart } from "@/components/charts/student-class-distribution-chart";
import { DashboardCalendar } from "@/components/layout/dashboard-calendar";
import { getStudentStats } from "@/services/studentService";
import { getCourseCount } from "@/services/courseService";
import { getStaffCount } from "@/services/staffService";
import { getOverduePayments } from "@/services/dueDateService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getActiveAnnouncements, getAnnouncementsByStatus, incrementAnnouncementViews } from "@/services/announcementService";
import type { Announcement } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";

export default function DashboardPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        students: 0,
        courses: 0,
        staff: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
    const [overdue, setOverdue] = useState<any>(null);
    const [isLoadingOverdue, setIsLoadingOverdue] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [studentStats, coursesCount, staffCount] = await Promise.all([
                    getStudentStats(),
                    getCourseCount(),
                    getStaffCount(),
                ]);

                setStats({
                    students: studentStats.activeCount,
                    courses: coursesCount,
                    staff: staffCount,
                });
            } catch (error) {
                 toast({
                    title: t("common.error"),
                    description: t("dashboard.errorLoadingStats"),
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [toast, t]);

    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                const [activeAnnouncements, scheduledAnnouncements] = await Promise.all([
                    getActiveAnnouncements(undefined, 10),
                    getAnnouncementsByStatus("scheduled")
                ]);
                
                // Merge and filter for today's events or active announcements
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                
                const merged = [...activeAnnouncements, ...scheduledAnnouncements]
                    .filter((a, index, self) => self.findIndex(x => x.id === a.id) === index) // deduplicate
                    .filter(a => {
                        // Include if active and not expired
                        if (a.status === 'active') return true;
                        
                        // Include scheduled if eventDate is today or in near future
                        if (a.eventDate) {
                            const eventDate = new Date(a.eventDate);
                            eventDate.setHours(0, 0, 0, 0);
                            return eventDate >= today && eventDate <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                        }
                        
                        return false;
                    })
                    .slice(0, 5);
                
                setAnnouncements(merged);
            } catch (error) {
                console.error("Error loading announcements:", error);
            } finally {
                setIsLoadingAnnouncements(false);
            }
        };
        fetchAnnouncements();
    }, []);

    useEffect(() => {
        const fetchOverdue = async () => {
            try {
                const overdueData = await getOverduePayments();
                setOverdue(overdueData);
            } catch (error) {
                console.error("Error loading overdue payments:", error);
            } finally {
                setIsLoadingOverdue(false);
            }
        };
        fetchOverdue();
    }, []);

    const handleAnnouncementView = async (id: string) => {
        try {
            await incrementAnnouncementViews(id);
        } catch (error) {
            console.error("Error incrementing views:", error);
        }
    };

    const getPriorityBadge = (priority?: string) => {
        switch (priority) {
            case "urgent":
                return <Badge variant="destructive" className="mr-2 text-xs"><AlertCircle className="w-3 h-3 ml-1" />عاجل</Badge>;
            case "important":
                return <Badge variant="default" className="mr-2 text-xs bg-orange-500"><Bell className="w-3 h-3 ml-1" />مهم</Badge>;
            default:
                return null;
        }
    };

    const renderStat = (value: number | null, suffix: string = "") => {
        if (isLoading) {
            return <Loader2 className="h-6 w-6 animate-spin" />;
        }
        if (value === null) {
            return <div className="text-3xl font-bold">N/A</div>;
        }
        return <div className="text-3xl font-bold">{value.toFixed(0)}{suffix}</div>;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    };

    return (
        <div className="flex flex-col gap-6">
            <h1 className="sr-only">{t('dashboard.title')}</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle as="h2" className="text-sm font-medium">{t("dashboard.totalStudents")}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.students)}
                        <p className="text-xs text-muted-foreground">{t("dashboard.activeStudents")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle as="h2" className="text-sm font-medium">{t("dashboard.availableCourses")}</CardTitle>
                        <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.courses)}
                        <p className="text-xs text-muted-foreground">{t("dashboard.totalCourses")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle as="h2" className="text-sm font-medium">{t("dashboard.staffMembers")}</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.staff)}
                        <p className="text-xs text-muted-foreground">{t("dashboard.activeStaff")}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5" />
                            {t("dashboard.studentEnrollment")}
                        </CardTitle>
                        <CardDescription>{t("dashboard.enrollmentSubtitle")}</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <StudentEnrollmentChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <PieChart className="h-5 w-5" />
                            {t("dashboard.studentDistribution")}
                        </CardTitle>
                        <CardDescription>{t("dashboard.distributionSubtitle")}</CardDescription>
                    </CardHeader>
                     <CardContent className="h-[300px] w-full">
                        <StudentClassDistributionChart />
                    </CardContent>
                </Card>
            </div>
             <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Overdue Payments Alert */}
                {overdue && !isLoadingOverdue && (overdue.overdueStudents.length > 0 || overdue.overdueStaff.length > 0) && (
                    <Card className="border-red-200 bg-red-50 lg:col-span-3">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="h-5 w-5" />
                                تنبيه: مستحقات مالية متأخرة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {overdue.overdueStudents.length > 0 && (
                                    <Link href="/finance/due-payments">
                                        <div className="p-4 bg-white rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer">
                                            <p className="font-semibold text-sm mb-2 text-red-700">👨‍🎓 رسوم الطلاب المتأخرة</p>
                                            <p className="text-2xl font-bold text-red-700">{overdue.overdueStudents.length}</p>
                                            <p className="text-sm text-muted-foreground">{formatCurrency(overdue.totalOverdueStudentAmount)}</p>
                                        </div>
                                    </Link>
                                )}
                                {overdue.overdueStaff.length > 0 && (
                                    <Link href="/finance/due-payments">
                                        <div className="p-4 bg-white rounded-lg border border-red-200 hover:shadow-md transition-shadow cursor-pointer">
                                            <p className="font-semibold text-sm mb-2 text-red-700">👔 رواتب الموظفين المتأخرة</p>
                                            <p className="text-2xl font-bold text-red-700">{overdue.overdueStaff.length}</p>
                                            <p className="text-sm text-muted-foreground">{formatCurrency(overdue.totalOverdueStaffAmount)}</p>
                                        </div>
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="lg:col-span-1">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Calendar className="h-5 w-5" />
                            {t("dashboard.schoolCalendar")}
                        </CardTitle>
                        <CardDescription>{t("dashboard.calendarSubtitle")}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                       <DashboardCalendar />
                    </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5" />
                                    📢 الإعلانات النشطة
                                </CardTitle>
                                <CardDescription>آخر الإعلانات والأخبار المهمة</CardDescription>
                            </div>
                            <Link href="/communication/announcements">
                                <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">
                                    عرض الكل
                                </Badge>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoadingAnnouncements ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : announcements.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                لا توجد إعلانات نشطة حالياً
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {announcements.map((announcement) => (
                                    <div 
                                        key={announcement.id}
                                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => handleAnnouncementView(announcement.id)}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {getPriorityBadge(announcement.priority)}
                                                <h4 className="font-semibold text-base">{announcement.title}</h4>
                                            </div>
                                            {announcement.viewCount !== undefined && (
                                                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                                    <Eye className="w-3 h-3" />
                                                    {announcement.viewCount}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                            {announcement.content}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            {announcement.eventDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    موعد: {format(new Date(announcement.eventDate), "dd MMM yyyy", { locale: ar })}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                نشر: {format(new Date(announcement.publishDate), "dd MMM yyyy", { locale: ar })}
                                            </span>
                                            {announcement.expiryDate && (
                                                <span>
                                                    ينتهي: {format(new Date(announcement.expiryDate), "dd MMM", { locale: ar })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}