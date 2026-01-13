
"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Student, Course, TimetableEntry, ReportCard } from "@/lib/types";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { getCoursesByGrade, getSupportCourses } from "@/services/courseService";
import { getAttendanceForStudent, getAttendance } from "@/services/attendanceService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { getTimetableForClass } from "@/services/timetableService";
import { generateReportCard } from "@/services/reportCardService";
import { calculateConductSummary, getRecentConductNotes } from "@/services/conductService";
import { getUpcomingWorkForStudent } from "@/services/studentWorkService";
import { Loader2, User, BookOpen, CalendarCheck, ShieldX, Clock, FileText, Wand2, Star, TrendingUp, Alert, AlertCircle, CheckCircle2, Calendar, BookOpenCheck } from "lucide-react";
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
import { getAnnouncements } from "@/services/announcementService";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "@/i18n/translation-provider";
import PrototypePortal from "@/components/parent-portal/PrototypePortal";

type CourseWithGrade = Course & { finalGrade: number | null };
type GeneratingState = "idle" | "fetching" | "compiling" | "writing" | "done";


const daysOfWeek = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
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
  const { t } = useTranslation();
    const params = useParams();
    const token = params?.token as string | undefined;
  const { toast } = useToast();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [supportCourses, setSupportCourses] = useState<Course[]>([]);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [isAnnouncementsLoading, setIsAnnouncementsLoading] = useState(true);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [attendanceRate, setAttendanceRate] = useState<number>(0);
  const [behaviorNotes, setBehaviorNotes] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAssignments, setPendingAssignments] = useState<number>(0);
  const [conductStatus, setConductStatus] = useState<string>('ممتاز');
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [conductSummary, setConductSummary] = useState<any>(null);

  // State for report card generation
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);
  const [reportingPeriod, setReportingPeriod] = useState("");
  const [generatedReport, setGeneratedReport] = useState<ReportCard | null>(null);
  const [generatingState, setGeneratingState] = useState<GeneratingState>("idle");
    const [timetableCompact, setTimetableCompact] = useState(false);

    const generatingMessages: Record<GeneratingState, string> = {
            idle: t('pp.report.generateAi'),
            fetching: t('pp.report.fetching'),
            compiling: t('pp.report.compiling'),
            writing: t('pp.report.writing'),
            done: t('pp.report.done'),
    };

  useEffect(() => {
    const fetchData = async () => {
      try {
                const studentId = await validateParentAccessToken(token as string);
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

        console.log('👤 Loading parent portal data for:', studentData.name, 'Grade:', studentData.grade);

        // Get all courses for grade level
        const gradeCourses = await getCoursesByGrade(String(studentData.grade));
        
        // Get grades for each course
        const coursesWithGrades = await Promise.all(
          gradeCourses.map(async (course) => {
            const finalGrade = await getStudentGradeForCourse(course.id, studentId);
            return { ...course, finalGrade };
          })
        );
        
        setEnrolledCourses(coursesWithGrades);
        console.log('📚 Loaded', coursesWithGrades.length, 'courses');

        // Get attendance data
        const studentAttendance = await getAttendanceForStudent(studentId);
        const recentAttendance = studentAttendance
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 10);
        
        setAttendance(recentAttendance);
        
        // Calculate attendance rate
        if (studentAttendance.length > 0) {
          const present = studentAttendance.filter(a => a.status === 'present').length;
          const rate = Math.round((present / studentAttendance.length) * 100);
          setAttendanceRate(rate);
          console.log('📊 Attendance rate:', rate + '%');
        }

        // Get timetable
        const timetableData = await getTimetableForClass(studentData.grade, studentData.className).catch(() => []);
        setTimetable(timetableData);

        // Get support courses
        const allSupportCourses = await getSupportCourses();
        setSupportCourses(allSupportCourses);

        // 🔴 جديد: احصل على بيانات السلوك الحقيقية
        const conduct = await calculateConductSummary(studentId);
        setConductSummary(conduct);
        setConductStatus(conduct.overallRating);
        console.log('📋 Conduct summary:', conduct);

        // احصل على آخر ملاحظات السلوك
        const recentNotes = await getRecentConductNotes(studentId, 5);
        setBehaviorNotes(recentNotes);
        console.log('📋 Recent behavior notes:', recentNotes);

        // 🔴 جديد: احصل على الواجبات والاختبارات القادمة
        const work = await getUpcomingWorkForStudent(
          studentId,
          String(studentData.grade),
          studentData.className
        );
        setUpcomingAssignments(work.assignments);
        setUpcomingExams(work.exams);
        setPendingAssignments(work.totalPending);
        console.log('📝 Pending assignments:', work.totalPending);
        console.log('📅 Upcoming exams:', work.exams.length);

      } catch (error) {
        console.error("Error fetching parent portal data:", error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [token]);

    // Prototype gate: enabled only when NEXT_PUBLIC_ENABLE_PROTOTYPE=true
    const enablePrototype = process.env.NEXT_PUBLIC_ENABLE_PROTOTYPE === 'true';

    // Load a small set of announcements for the prominent board
    useEffect(() => {
        const loadAnnouncements = async () => {
            if (!token) return;
            setIsAnnouncementsLoading(true);
            try {
                const studentId = await validateParentAccessToken(token as string);
                if (!studentId) {
                    setAnnouncements([]);
                    setIsAnnouncementsLoading(false);
                    return;
                }
                const student = await getStudent(studentId);
                const all = await getAnnouncements(5);
                console.log('📢 MAIN PAGE - All announcements fetched:', all);
                
                const filtered = all.filter((a: any) => {
                    console.log(`  🔍 Filtering announcement "${a.title}"`);
                    
                    if (a.audience && a.audience !== 'both' && a.audience !== 'parents' && a.audience !== 'all') {
                        console.log(`    ❌ Filtered: audience is "${a.audience}"`);
                        return false;
                    }
                    
                    if (a.grade && student && String(a.grade) !== String(student.grade)) {
                        console.log(`    ❌ Filtered: grade mismatch`);
                        return false;
                    }
                    
                    if (a.className && student && String(a.className) !== String(student.className)) {
                        console.log(`    ❌ Filtered: className mismatch`);
                        return false;
                    }
                    
                    // ✅ REMOVED: This filter was excluding announcements with English text!
                    // const combined = `${a.title || ''} ${a.content || ''}`;
                    // if (/[A-Za-z]/.test(combined)) return false;
                    
                    console.log(`    ✅ Passed all filters!`);
                    return true;
                });
                
                console.log(`✨ Final announcements to display (${filtered.length}):`, filtered);
                setAnnouncements(filtered.slice(0,3));
            } catch (err) {
                console.error('❌ Error loading announcements:', err);
            } finally {
                setIsAnnouncementsLoading(false);
            }
        };
        void loadAnnouncements();
    }, [token, toast]);

  const handleGenerateReport = async () => {
    if (!student || !reportingPeriod) {
                toast({ title: "معلومات مفقودة", description: "الرجاء إدخال فترة التقرير.", variant: "destructive"});
        return;
    }
    setGeneratedReport(null);
    try {
        setGeneratingState("fetching");
        await new Promise(res => setTimeout(res, 500));
        setGeneratingState("compiling");
    setGeneratingState("writing");
    // Use the service to create a (mock) report card object matching the ReportCard type
    const report = await generateReportCard(student.id, reportingPeriod);
    await new Promise(res => setTimeout(res, 500));
    setGeneratedReport(report);
        setGeneratingState("done");
    } catch (error) {
        console.error(error);
        toast({ title: "خطأ في توليد التقرير", description: "حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.", variant: "destructive"});
        setGeneratingState("idle");
    } finally {
        setTimeout(() => setGeneratingState("idle"), 2000);
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }
    // Display a shortened, user-friendly student ID for parents
    const formatId = (id?: string | number) => {
        const value = String(id ?? '').trim();
        if (!value) return '';
        // Extract numeric part and format as ST{3digit}
        const numericId = value.replace(/\D/g, '');
        const shortId = numericId.slice(-3).padStart(3, '0');
        return `ST${shortId}`;
    };

    // Map displayed Arabic day names to canonical keys returned by the timetable API
    const dayKeyMap: Record<string, string> = {
        'الاثنين': 'Monday',
        'الثلاثاء': 'Tuesday',
        'الأربعاء': 'Wednesday',
        'الخميس': 'Thursday',
        'الجمعة': 'Friday',
    }

    const normalizeSlot = (s: string) => (s || '').replace(/\s+/g, '').toLowerCase();

    const getEntryForSlot = (day: string, timeSlot: string) => {
        const key = dayKeyMap[day] || day;
        return timetable.find(entry => {
            const entryDay = entry?.day || '';
            const entrySlot = entry?.timeSlot || '';
            // Allow matching by either API key (English) or localized label, and tolerate spacing differences in timeSlot
            const daysMatch = entryDay === key || entryDay === day;
            const slotsMatch = normalizeSlot(entrySlot) === normalizeSlot(timeSlot);
            return daysMatch && slotsMatch;
        });
    }
  
    if (isLoading) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-muted">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    <p className="mt-4 text-foreground">{t('pp.loading.checkingLink')}</p>
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
                <CardTitle className="text-2xl">{t('pp.unauthorized.title')}</CardTitle>
                <CardDescription>
                    {t('pp.unauthorized.description')}
                </CardDescription>
                        </CardHeader>
                </Card>
            </div>
        );
    }

        // After validation, render the prototype only when the env gate is enabled.
        if (enablePrototype && student) {
            return <PrototypePortal student={student} announcements={announcements} attendance={attendance} timetable={timetable} enrolledCourses={enrolledCourses} supportCourses={supportCourses} />;
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
                    <span className="text-lg font-semibold">{t('pp.parentPortal.title')}</span>
                </div>
                <div className="text-right text-sm">
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-muted-foreground">الصف {student.grade} — الفصل {student.className}</p>
                    <div className="mt-2 flex items-center justify-end gap-2">
                        <Link href={`./assignments-simple`}>
                            <Button size="sm">{t('nav.assignments')}</Button>
                        </Link>
                        <Link href={`./calendar`}>
                            <Button size="sm" variant="outline">{t('nav.calendar')}</Button>
                        </Link>
                        <Link href={`./attendance`}>
                            <Button size="sm" variant="ghost">{t('nav.attendance') || 'الحضور'}</Button>
                        </Link>
                        <Link href={`./behavior`}>
                            <Button size="sm" variant="ghost">{t('nav.behavior') || 'السلوك'}</Button>
                        </Link>
                            <Link href={`./announcements`}>
                                <Button size="sm" variant="ghost">{t('nav.announcements')}</Button>
                            </Link>
                            <Link href={`/communication/messages?withStudentId=${student.id}&parentName=${encodeURIComponent(student.parentName)}`}>
                                <Button size="sm" variant="ghost">{t('nav.messages')}</Button>
                            </Link>
                    </div>
                </div>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-6 lg:p-8">
            {/* ملخص سريع - 4 مؤشرات أساسية */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* المؤشر 1: التقدم الأكاديمي */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    التقدم الأكاديمي
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {enrolledCourses.length > 0 
                      ? Math.round(enrolledCourses.reduce((sum, c) => sum + (c.finalGrade || 0), 0) / enrolledCourses.length)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">من {enrolledCourses.length} مادة</p>
                </CardContent>
              </Card>

              {/* المؤشر 2: الحضور */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    نسبة الحضور
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {attendanceRate}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{attendance.length} أيام مسجلة</p>
                </CardContent>
              </Card>

              {/* المؤشر 3: السلوك */}
              <Card className="border-l-4 border-l-yellow-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    السلوك والانضباط
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-yellow-100 text-yellow-800">{conductStatus}</Badge>
                  <p className="text-xs text-muted-foreground mt-2">حالة السلوك الحالية</p>
                </CardContent>
              </Card>

              {/* المؤشر 4: الواجبات المعلقة */}
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    واجبات معلقة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">
                    {pendingAssignments}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">تنتظر التسليم</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 flex flex-col gap-6">
                     <Card>
                        <CardHeader className="items-center text-center">
                            <Avatar className="h-24 w-24 mb-4">
                                <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} data-ai-hint="student photo" />
                                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <CardTitle className="text-2xl">{student.name}</CardTitle>
                            <CardDescription>الصف {student.grade} — الفصل {student.className}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Separator className="my-4" />
                                              <div className="space-y-2 text-sm">
                                                      <p><span className="font-semibold">{t('student.idLabel')}:</span> {formatId(student.id)}</p>
                                                  <p><span className="font-semibold">{t('student.emailLabel')}:</span> {student.email}</p>
                                                  <p><span className="font-semibold">{t('student.guardianLabel')}:</span> {student.parentName}</p>
                                                  <p><span className="font-semibold">{t('student.contactLabel')}:</span> {student.contact}</p>
                                              </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarCheck />
                                {t('attendance.title')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                           {attendance.length > 0 ? (
                                <div className="space-y-3">
                                    {attendance.map((att, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                 <p className="font-medium">{t('attendance.record')}</p>
                                                 <p className="text-sm text-muted-foreground">{format(new Date(att.date), "PPP")}</p>
                                            </div>
                                            <Badge variant={att.status === 'present' ? 'secondary' : (att.status === 'late' ? 'default' : 'destructive')} className="capitalize">
                                                {att.status === 'present' ? t('attendance.present') : (att.status === 'late' ? t('attendance.late') : t('attendance.absent'))}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                           ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">لا توجد سجلات حضور.</p>
                           )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5" />
                                السلوك والانضباط
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {conductSummary ? (
                                <div className="space-y-4">
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-muted-foreground">التقييم العام:</span>
                                            <Badge className={`${
                                                conductSummary.overallRating === 'ممتاز' ? 'bg-green-500' :
                                                conductSummary.overallRating === 'جيد' ? 'bg-blue-500' :
                                                conductSummary.overallRating === 'متوسط' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}>
                                                {conductSummary.overallRating}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                                <p className="text-muted-foreground">إيجابي</p>
                                                <p className="font-bold text-green-600">{conductSummary.positiveCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">سلبي</p>
                                                <p className="font-bold text-red-600">{conductSummary.negativeCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground">إجمالي</p>
                                                <p className="font-bold">{conductSummary.totalNotes}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Recent behavior notes */}
                                    {behaviorNotes.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold text-muted-foreground">آخر الملاحظات:</p>
                                            {behaviorNotes.slice(0, 3).map((note: any) => (
                                                <div key={note.id} className={`p-2 text-xs rounded border-l-2 ${
                                                    note.type === 'positive' 
                                                        ? 'border-l-green-500 bg-green-50' 
                                                        : note.type === 'negative' 
                                                        ? 'border-l-red-500 bg-red-50'
                                                        : 'border-l-gray-500 bg-gray-50'
                                                }`}>
                                                    <p className="font-medium">{note.note}</p>
                                                    <p className="text-muted-foreground mt-1">{new Date(note.date).toLocaleDateString('ar-SA')}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">لا توجد ملاحظات سلوك بعد.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                            <CardHeader className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2">{t('announcements.title')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isAnnouncementsLoading ? (
                                <p>{t('announcements.loading')}</p>
                            ) : announcements.length === 0 ? (
                                <p className="text-muted-foreground">{t('announcements.noForParents')}</p>
                            ) : (
                                <div className="space-y-3">
                                    {announcements.map(a => (
                                        <article key={a.id} className="p-3 border rounded-md">
                                            <h3 className="font-semibold">{a.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-2">{a.content}</p>
                                            <div className="text-xs text-muted-foreground mt-2">{a.createdAt}</div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex justify-between items-center">
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen />
                                {t('academic.progressTitle')}
                            </CardTitle>
                            {/* Report dialog removed in dev: avoid prompting parents to enter a period */}
                        </CardHeader>
                        <CardContent>
                            {enrolledCourses.length > 0 ? (
                                <div className="space-y-6">
                                    {enrolledCourses.map(course => (
                                        <div key={course.id}>
                                            <div className="flex justify-between items-center mb-2">
                                                <Link href={`/parent-portal/${token}/courses/${course.id}`} className="font-medium text-primary underline">{course.name}</Link>
                                                    <span className={`font-semibold ${course.finalGrade === null ? 'text-muted-foreground' : course.finalGrade < 50 ? 'text-destructive' : 'text-primary'}`}>
                                                    {course.finalGrade !== null ? `${course.finalGrade.toFixed(1)}%` : 'غير متوفر'}
                                                </span>
                                            </div>
                                            <Progress value={course.finalGrade} className="h-2" />
                                        </div>
                                    ))}
                                </div>
                            ): (
                                <p className="text-sm text-muted-foreground text-center py-8">{t('courses.noGrades')}</p>
                            )}
                        </CardContent>
                    </Card>
                     <Card>
                                                <CardHeader className="flex items-center gap-2 justify-between">
                                                        <div className="flex items-center gap-2">
                                                                <Clock />
                                                                <CardTitle>{t('schedule.title')}</CardTitle>
                                                        </div>
                                                        <div className="timetable-controls">
                                                            <div className="timetable-legend">
                                                                <div className="swatch" style={{background:'#7c3aed'}}></div>
                                                                <div>مادة — مدرس — قاعة</div>
                                                            </div>
                                                            <button className="btn-compact" onClick={() => setTimetableCompact(c => !c)}>{timetableCompact ? 'الوضع العادي' : 'وضع مضغوط'}</button>
                                                        </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className={`rounded-lg overflow-hidden border parent-timetable ${timetableCompact ? 'compact' : ''}`}>
                                                        <div className="w-full overflow-auto">
                                                            <div style={{display:'grid', gridTemplateColumns:'140px repeat(5, minmax(0,1fr))'}} className="text-sm">
                                                                <div className="p-3 bg-gradient-to-r from-primary to-indigo-500 text-white font-medium">الوقت</div>
                                                                {daysOfWeek.map(day => (
                                                                    <div key={day} className="p-3 text-center bg-indigo-50 font-medium">{day}</div>
                                                                ))}

                                                                {timeSlots.map((timeSlot, idx) => (
                                                                    <div key={timeSlot} className="contents">
                                                                        <div className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} p-3 font-mono text-xs`}>{timeSlot}</div>
                                                                        {daysOfWeek.map(day => {
                                                                            const entry = getEntryForSlot(day, timeSlot);
                                                                            return (
                                                                                <div key={`${day}-${timeSlot}`} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} p-3 align-top`}>
                                                                                    {entry ? (
                                                                                        <div className="flex flex-col items-start gap-1 p-3 rounded-lg shadow-sm bg-white border-l-4 border-indigo-400">
                                                                                            <div className="font-semibold text-indigo-700 text-sm truncate">{entry.courseName}</div>
                                                                                            <div className="text-xs text-muted-foreground truncate">{entry.teacherName}</div>
                                                                                            <div className="text-xs text-muted-foreground">
                                                                                                {entry.location || entry.classroom || entry.venue || (entry as any).room || ''}
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="text-center text-muted-foreground">-</div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpenCheck />
                                الواجبات والاختبارات القادمة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* عرض الواجبات القادمة */}
                                {upcomingAssignments.length > 0 ? (
                                    upcomingAssignments.slice(0, 5).map((assignment, idx) => (
                                        <div key={`assignment-${assignment.id}`} className="p-3 border-r-4 border-r-blue-500 bg-blue-50 rounded">
                                            <p className="font-semibold text-sm">{assignment.name}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{assignment.courseName}</p>
                                            <p className="text-xs text-muted-foreground">
                                                📅 {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString('ar-SA') : 'لا يوجد تاريخ'}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-3 text-center text-muted-foreground">
                                        ✅ لا توجد واجبات معلقة
                                    </div>
                                )}

                                {/* عرض الاختبارات القادمة */}
                                {upcomingExams.length > 0 && (
                                    <>
                                        <Separator className="my-3" />
                                        {upcomingExams.slice(0, 5).map((exam, idx) => (
                                            <div key={`exam-${exam.id}`} className="p-3 border-r-4 border-r-green-500 bg-green-50 rounded">
                                                <p className="font-semibold text-sm">اختبار {exam.courseName}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{exam.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    📅 {new Date(exam.examDate).toLocaleDateString('ar-SA')} - المدة: {exam.duration} دقيقة
                                                </p>
                                            </div>
                                        ))}
                                    </>
                                )}

                                {upcomingAssignments.length === 0 && upcomingExams.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">✅ لا توجد واجبات أو اختبارات قادمة</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Star />
                                {t('supportPrograms')}
                            </CardTitle>
                            <CardDescription>
                                {t('supportPrograms.browseAvailable')}
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
                                                    <p className="text-sm text-muted-foreground">Instructor: {course.teachers?.[0]?.name || 'TBA'}</p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <p className="text-sm text-muted-foreground">{course.description}</p>
                                            </AccordionContent>
                                        </AccordionItem>
                                   ))}
                               </Accordion>
                           ): (
                                <p className="text-sm text-muted-foreground text-center py-8">{t('supportPrograms.noAvailable')}</p>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
}
