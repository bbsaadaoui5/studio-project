
"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Clock, BookOpen, User, BookMarked, CalendarDays, Megaphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTimetableForTeacher } from "@/services/timetableService";
import { getCourses } from "@/services/courseService";
import { getStaffMember } from "@/services/staffService";
import { getAnnouncements } from "@/services/announcementService";
import type { Course, TimetableEntry, Staff, Announcement } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

// In a real app, this would come from an authentication context
const DEFAULT_TEACHER_ID = "staff_teacher_01"; // Let's assume Fatima Al-Fihri

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
];

export default function TeacherDashboardPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  // Allow admin to view a specific teacher's dashboard
  const teacherId = searchParams.get('teacherId') || DEFAULT_TEACHER_ID; 

  const [teacher, setTeacher] = useState<Staff | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        const [teacherData, allCourses, recentAnnouncements] = await Promise.all([
          getStaffMember(teacherId),
          getCourses(),
          getAnnouncements(3), // Fetch latest 3 announcements
        ]);
        
        if (!teacherData) {
            toast({ title: "Error", description: "Could not find teacher data.", variant: "destructive"});
            return;
        }

        setTeacher(teacherData);
        setAnnouncements(recentAnnouncements);
        
        const teacherCourses = allCourses.filter(c => c.teacher === teacherData.name);
        setCourses(teacherCourses);

        const timetableData = await getTimetableForTeacher(teacherData.name);
        setTimetable(timetableData);

      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch teacher dashboard data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeacherData();
  }, [toast, teacherId]);
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('') || '';
  }
  
  const getEntryForSlot = (day: string, timeSlot: string) => {
    return timetable.find(entry => entry.day === day && entry.timeSlot === timeSlot);
  }


   if (isLoading) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!teacher) {
      return <p className="text-center text-destructive">Could not load teacher data.</p>
  }


  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
                <AvatarImage src={`https://picsum.photos/seed/${teacher.id}/100/100`} data-ai-hint="teacher photo" />
                <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
            </Avatar>
            <div>
                <h1 className="text-3xl font-bold">Welcome, {teacher.name}!</h1>
                <p className="text-muted-foreground">Here's your dashboard for today.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Clock /> My Timetable</CardTitle>
                        <CardDescription>Your weekly teaching schedule.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-[1fr_repeat(5,2fr)] text-xs md:text-sm">
                                <div className="font-semibold bg-muted p-2 border-b border-r"><CalendarDays className="inline-block mr-1" /> Time</div>
                                {daysOfWeek.map(day => (
                                    <div key={day} className="font-semibold bg-muted p-2 text-center border-b border-r last:border-r-0">{day.substring(0,3)}</div>
                                ))}

                                {timeSlots.map(timeSlot => (
                                    <div key={timeSlot} className="contents">
                                        <div className="p-2 border-b border-r font-mono">{timeSlot.split(' - ')[0]}</div>
                                        {daysOfWeek.map(day => {
                                            const entry = getEntryForSlot(day, timeSlot);
                                            return (
                                                <div key={`${day}-${timeSlot}`} className="p-2 border-b border-r last:border-r-0 text-center">
                                                    {entry ? (
                                                        <div className="bg-primary/10 text-primary p-1 rounded-md">
                                                            <p className="font-semibold leading-tight">{`G${entry.grade}-${entry.className}`}</p>
                                                            <p className="text-xs opacity-80 leading-tight truncate">{entry.courseName}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
             </div>
             <div className="lg:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BookMarked /> My Courses</CardTitle>
                        <CardDescription>Courses you are assigned to teach.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {courses.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Course Name</TableHead>
                                        <TableHead>Grade</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {courses.map(course => (
                                        <TableRow key={course.id}>
                                            <TableCell className="font-medium">{course.name}</TableCell>
                                            <TableCell>Grade {course.grade}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">You are not assigned to any courses.</p>
                        )}
                    </CardContent>
                </Card>
                <Card>
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Megaphone /> Recent Announcements</CardTitle>
                        <CardDescription>Latest updates from the school.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {announcements.length > 0 ? (
                            <div className="space-y-4">
                                {announcements.map((ann, i) => (
                                    <div key={ann.id}>
                                        <div className="font-semibold">{ann.title}</div>
                                        <div className="text-xs text-muted-foreground">{format(new Date(ann.createdAt), 'PPP')}</div>
                                        {i < announcements.length -1 && <Separator className="mt-4" />}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No recent announcements.</p>
                        )}
                    </CardContent>
                </Card>
             </div>
        </div>
    </div>
  );
}
