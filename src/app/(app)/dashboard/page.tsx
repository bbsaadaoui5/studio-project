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

export default function DashboardPage() {
    const { toast } = useToast();
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
                    title: "Error",
                    description: "Failed to load dashboard statistics.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, [toast]);

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
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.students)}
                        <p className="text-xs text-muted-foreground">Currently active students</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Courses Offered</CardTitle>
                        <BookOpenCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.courses)}
                        <p className="text-xs text-muted-foreground">Total courses in catalog</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {renderStat(stats.staff)}
                        <p className="text-xs text-muted-foreground">All active staff</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart className="h-5 w-5" />
                            New Student Enrollments
                        </CardTitle>
                        <CardDescription>Monthly new student enrollment over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full">
                        <StudentEnrollmentChart />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <PieChart className="h-5 w-5" />
                            Student Distribution
                        </CardTitle>
                        <CardDescription>Distribution of students across different classes.</CardDescription>
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
                            School Calendar
                        </CardTitle>
                        <CardDescription>Click on a date to see events.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                       <DashboardCalendar />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}