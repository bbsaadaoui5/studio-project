
"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Student, Course, TimetableEntry, ReportCard } from "@/lib/types";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { getCoursesForStudent } from "@/services/enrollmentService";
import { getCourse, getSupportCourses } from "@/services/courseService";
import { getAttendanceForStudent } from "@/services/attendanceService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { getTimetableForClass } from "@/services/timetableService";
import { generateReportCard } from "@/services/reportCardService";
import { Loader2, User, BookOpen, CalendarCheck, ShieldX, Clock, FileText, Wand2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type CourseWithGrade = Course & { finalGrade: number | null };
type GeneratingState = "idle" | "fetching" | "compiling" | "writing" | "done";


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

export default function ParentPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithGrade[]>([]);
  const [supportCourses, setSupportCourses] = useState<Course[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for report card generation
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [generatedReport, setGeneratedReport] = useState<ReportCard | null>(null);
  const [generatingState, setGeneratingState] = useState<GeneratingState>("idle");

  const generatingMessages: Record<GeneratingState, string> = {
    idle: "Generate with AI",
    fetching: "Fetching data...",
    compiling: "Compiling grades...",
    writing: "Writing comments...",
    done: "Done!",
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          setIsValidToken(false);
          return;
        }
        setIsValidToken(true);

        const studentData = await getStudent(studentId);
        setStudent(studentData);
        if (!studentData) {
            setIsValidToken(false);
            return;
        }

        const [courseIds, studentAttendance, timetableData, allSupportCourses] = await Promise.all([
            getCoursesForStudent(studentId),
            getAttendanceForStudent(studentId),
            getTimetableForClass(studentData.grade, studentData.className),
            getSupportCourses(),
        ]);
        
        setSupportCourses(allSupportCourses);
        setTimetable(timetableData);
        setAttendance(
          studentAttendance
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5) // Get last 5 attendance records
        );

        if (courseIds.length > 0) {
            const coursePromises = courseIds.map(async (id) => {
                const course = await getCourse(id);
                if (!course) return null;
                const finalGrade = await getStudentGradeForCourse(id, studentId);
                return { ...course, finalGrade };
            });

            const courses = await Promise.all(coursePromises);
            const validCourses = courses.filter(c => c !== null) as CourseWithGrade[];
            setEnrolledCourses(validCourses);
        }

      } catch (error) {
        console.error("Error fetching parent portal data:", error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

  const handleGenerateReport = async () => {
    if (!student || !reportingPeriod) {
        toast({ title: "Missing Information", description: "Please enter a reporting period.", variant: "destructive"});
        return;
    }
    setGeneratedReport(null);
    try {
        setGeneratingState("fetching");
        await new Promise(res => setTimeout(res, 500));
        setGeneratingState("compiling");
        const report = { report: "Mock report card" };
        setGeneratingState("writing");
        await new Promise(res => setTimeout(res, 1500));
        setGeneratedReport(report);
        setGeneratingState("done");
    } catch (error) {
        console.error(error);
        toast({ title: "Error Generating Report", description: "An unexpected error occurred. Please try again.", variant: "destructive"});
        setGeneratingState("idle");
    } finally {
        setTimeout(() => setGeneratingState("idle"), 2000);
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const getEntryForSlot = (day: string, timeSlot: string) => {
    return timetable.find(entry => entry.day === day && entry.timeSlot === timeSlot);
  }
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!isValidToken || !student) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle className="flex justify-center">
                    <ShieldX className="h-16 w-16 text-destructive" />
                </CardTitle>
                <CardTitle className="text-2xl">Access Denied</CardTitle>
                <CardDescription>
                    The access link is invalid, expired, or has been revoked. Please request a new link from the school administration.
                </CardDescription>
            </CardHeader>
        </Card>
      </div>
    );
  }
  
  const isGenerating = generatingState !== 'idle' && generatingState !== 'done';

  return (
    <div className="min-h-screen bg-muted/40">
        <header className="bg-background border-b">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                 <div className="flex items-center gap-2">
                    <div className="bg-primary rounded-md p-1.5">
                        <GraduationCap className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <span className="text-lg font-semibold">CampusConnect Parent Portal</span>
                </div>
                <div className="text-right text-sm">
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-muted-foreground">Grade {student.grade}, Class {student.className}</p>
                </div>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                     <Card>
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} data-ai-hint="student photo" />
                                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-2xl">{student.name}</CardTitle>
                            <CardDescription>Grade {student.grade} - Class {student.className}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Separator className="my-4" />
                             <div className="space-y-2 text-sm">
                                <p><span className="font-semibold">Student ID:</span> {student.id}</p>
                                <p><span className="font-semibold">Email:</span> {student.email}</p>
                                <p><span className="font-semibold">Guardian:</span> {student.parentName}</p>
                                <p><span className="font-semibold">Contact:</span> {student.contact}</p>
                             </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarCheck />
                                Recent Attendance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           {attendance.length > 0 ? (
                                <div className="space-y-3">
                                    {attendance.map((att, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                 <p className="font-medium">Daily Attendance</p>
                                                 <p className="text-sm text-muted-foreground">{format(new Date(att.date), "PPP")}</p>
                                            </div>
                                            <Badge variant={att.status === 'present' ? 'secondary' : (att.status === 'late' ? 'default' : 'destructive')} className="capitalize">
                                                {att.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                           ): (
                                <p className="text-sm text-muted-foreground text-center py-8">No attendance records found.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen />
                                Academic Progress
                            </CardTitle>
                            <Dialog open={isReportCardOpen} onOpenChange={setIsReportCardOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline"><FileText /> View Report Card</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Generate Official Report Card</DialogTitle>
                                        <DialogDescription>
                                            Enter the reporting period to generate a report with AI-powered comments.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        {!generatedReport && (
                                            <div className="flex items-end gap-2">
                                                <div className="flex-1 space-y-2">
                                                    <Label htmlFor="reporting-period">Reporting Period</Label>
                                                    <Input 
                                                        id="reporting-period" 
                                                        placeholder="e.g., Semestre d'automne 2024"
                                                        value={reportingPeriod}
                                                        onChange={e => setReportingPeriod(e.target.value)}
                                                    />
                                                </div>
                                                <Button onClick={handleGenerateReport} disabled={isGenerating || !reportingPeriod}>
                                                    {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                                    {generatingMessages[generatingState]}
                                                </Button>
                                            </div>
                                        )}
                                        {isGenerating && (
                                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                                <p className="text-muted-foreground">{generatingMessages[generatingState]}</p>
                                            </div>
                                        )}
                                        {generatedReport && (
                                           <div className="border rounded-lg p-4 max-h-[60vh] overflow-y-auto">
                                                <div className="text-center mb-4">
                                                    <h3 className="text-xl font-bold">{generatedReport.studentName}</h3>
                                                    <p>{generatedReport.class}</p>
                                                    <p className="text-muted-foreground">{generatedReport.reportingPeriod}</p>
                                                </div>
                                                <div className="space-y-4">
                                                    <div>
                                                        <h4 className="font-semibold">Overall Summary</h4>
                                                        <p className="text-sm text-muted-foreground italic">"{generatedReport.overallSummary}"</p>
                                                    </div>
                                                    <Separator />
                                                    <div className="space-y-3">
                                                        {generatedReport.courses.map((course, i) => (
                                                            <div key={i}>
                                                                <div className="flex justify-between font-semibold">
                                                                    <p>{course.courseName}</p>
                                                                    <p>{course.finalGrade}</p>
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">Taught by {course.teacherName}</p>
                                                                <p className="text-sm mt-1">{course.comments}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button variant="secondary" onClick={() => { setIsReportCardOpen(false); setGeneratedReport(null); setReportingPeriod("")}}>Close</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent>
                            {enrolledCourses.length > 0 ? (
                                <div className="space-y-6">
                                    {enrolledCourses.map(course => (
                                        <div key={course.id}>
                                            <div className="flex justify-between items-center mb-2">
                                                <p className="font-medium">{course.name}</p>
                                                <span className={`font-semibold ${course.finalGrade === null ? 'text-muted-foreground' : course.finalGrade < 50 ? 'text-destructive' : 'text-primary'}`}>
                                                    {course.finalGrade !== null ? `${course.finalGrade.toFixed(1)}%` : 'N/A'}
                                                </span>
                                            </div>
                                            <Progress value={course.finalGrade} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            ): (
                                <p className="text-sm text-muted-foreground text-center py-8">No grades available yet.</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock />
                                Weekly Timetable
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                             <div className="border rounded-lg overflow-hidden">
                                <div className="grid grid-cols-[1fr_repeat(5,2fr)] text-xs md:text-sm">
                                    <div className="font-semibold bg-muted p-2 border-b border-r">Time</div>
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
                                                                <p className="font-semibold leading-tight">{entry.courseName}</p>
                                                                <p className="text-xs opacity-80 leading-tight">{entry.teacherName}</p>
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star />
                                Support & Extracurricular Programs
                            </CardTitle>
                            <CardDescription>
                                Browse available support programs and activities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           {supportCourses.length > 0 ? (
                               <Accordion type="single" collapsible className="w-full">
                                   {supportCourses.map(course => (
                                        <AccordionItem value={course.id} key={course.id}>
                                            <AccordionTrigger>
                                                <div className="flex flex-col items-start text-left">
                                                    <p className="font-semibold">{course.name}</p>
                                                    <p className="text-sm text-muted-foreground">Instructor: {course.teacher}</p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <p className="text-sm text-muted-foreground">{course.description}</p>
                                            </AccordionContent>
                                        </AccordionItem>
                                   ))}
                               </Accordion>
                           ): (
                                <p className="text-sm text-muted-foreground text-center py-8">No support programs are available at this time.</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
