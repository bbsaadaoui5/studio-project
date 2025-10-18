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
} from "lucide-react";
import { StudentEnrollmentChart } from "@/components/charts/student-enrollment-chart";
import { StudentClassDistributionChart } from "@/components/charts/student-class-distribution-chart";
import { DashboardCalendar } from "@/components/layout/dashboard-calendar";
import { getStudentStats } from "@/services/studentService";
import { getCourseCount } from "@/services/courseService";
import { getStaffCount } from "@/services/staffService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";

export default function DashboardPage() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [stats, setStats] = useState({
        students: 0,
        courses: 0,
        staff: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

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

    const renderStat = (value: number | null, suffix: string = "") => {
        if (isLoading) {
            return <Loader2 className="h-6 w-6 animate-spin" />;
        }
        if (value === null) {
            return <div className="text-3xl font-bold">N/A</div>;
        }
        return <div className="text-3xl font-bold">{value.toFixed(0)}{suffix}</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="sr-only">{t('dashboard.title')}</h1>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.totalStudents")}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.students)}
                        <p className="text-xs text-muted-foreground">{t("dashboard.activeStudents")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.availableCourses")}</CardTitle>
                        <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.courses)}
                        <p className="text-xs text-muted-foreground">{t("dashboard.totalCourses")}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">{t("dashboard.staffMembers")}</CardTitle>
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
            </div>
        </div>
    );
}