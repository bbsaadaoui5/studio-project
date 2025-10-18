"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, UserPlus, Briefcase, BookOpenCheck, FileText, Receipt, Check, ChevronsUpDown, Loader2, View, User, Eye } from "lucide-react";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/translation-provider";
import { useState, useEffect, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { Student, Staff } from "@/lib/types";
import { getActiveStudents } from "@/services/studentService";
import { getStaffMembers } from "@/services/staffService";
import { getParentAccessLink } from "@/services/parentService";
import { useToast } from "@/hooks/use-toast";
import { getSettings } from "@/services/settingsService";
import { recordPayment } from "@/services/financeService";
import { cn } from "@/lib/utils";

const months = [
    "يناير", "فبراير", "مارس", "أبريل", "ماي", "يونيو", 
    "يوليوز", "غشت", "شتنبر", "أكتوبر", "نونبر", "دجنبر"
];

export function Header() {
    // Add state for selectedGrade (for parent portal dialog)
    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const { toast } = useToast();
    
    const [isClient, setIsClient] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    
    // State for Quick Payment Dialog
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStudentPopoverOpen, setIsStudentPopoverOpen] = useState(false);

    // State for View As Dialogs
    const [isViewParentDialogOpen, setIsViewParentDialogOpen] = useState(false);
    const [isViewTeacherDialogOpen, setIsViewTeacherDialogOpen] = useState(false);
    const [viewSelectedStudent, setViewSelectedStudent] = useState<string>("");
    const [viewSelectedTeacher, setViewSelectedTeacher] = useState<string>("");
    
    // Global state for students and staff
    const [students, setStudents] = useState<Student[]>([]);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const [academicYear, setAcademicYear] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number | "">("");
    const [paymentMonth, setPaymentMonth] = useState("");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "bank-transfer">("card");
    const [selectedStudent, setSelectedStudent] = useState<string>("");


    useEffect(() => {
        setIsClient(true);
        // Pre-fetch data on component mount
        const fetchInitialData = async () => {
            setIsLoadingData(true);
            try {
                const [fetchedStudents, fetchedStaff, settings] = await Promise.all([
                    getActiveStudents(),
                    getStaffMembers(),
                    getSettings()
                ]);
                setStudents(fetchedStudents);
                setStaff(fetchedStaff);
                setAcademicYear(settings.academicYear);
            } catch (error) {
                 toast({ title: "Error", description: "Could not pre-load necessary data.", variant: "destructive" });
            } finally {
                setIsLoadingData(false);
            }
        };
        fetchInitialData();
    }, [toast]);

    const pageTitle = useMemo(() => {
        if (!isClient) return "Dashboard";
        if (!pathname || typeof pathname !== 'string') return "Dashboard";
        const pathParts = pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1];
        if (pathParts.includes('directory') && pathParts.length > 2) {
            if(pathParts.includes('student-management')) return 'Student Profile';
            if(pathParts.includes('staff-management')) return 'Staff Profile';
        }
        return lastPart?.replace(/-/g, ' ') || 'Dashboard';
    }, [pathname, isClient]);




    const handleViewParentPortal = async () => {
        if (!viewSelectedStudent) return;
        setIsSubmitting(true);
        try {
            const link = await getParentAccessLink(viewSelectedStudent);
            if (link) {
                window.open(link, '_blank');
                setIsViewParentDialogOpen(false);
                setViewSelectedStudent("");
            } else {
                toast({
                    title: "No Access Link",
                    description: "A parent portal access link has not been generated for this student yet.",
                    variant: "destructive",
                });
            }
        } catch(error) {
             toast({ title: "Error", description: "Could not generate parent access link.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleViewTeacherPortal = () => {
        if (!viewSelectedTeacher) return;
        window.open(`/teacher/portal/${viewSelectedTeacher}`, '_blank');
        setIsViewTeacherDialogOpen(false);
        setViewSelectedTeacher("");
    }

    const handleRecordPayment = async () => {
         if (!selectedStudent || !paymentAmount || paymentAmount <= 0 || !paymentMonth) {
            toast({ title: "Invalid Input", description: "Please select a student, month, and enter a valid amount.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await recordPayment({
                studentId: selectedStudent,
                amount: Number(paymentAmount),
                date: new Date().toISOString(),
                month: paymentMonth,
                academicYear,
                method: paymentMethod
            });
            toast({ title: "Payment Recorded", description: "The payment has been successfully recorded." });
            
            setIsPaymentDialogOpen(false);
            setSelectedStudent("");
            setPaymentAmount("");
            setPaymentMonth("");

        } catch (error) {
            toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const getInitials = (name: string) => {
        return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '';
    }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="md:hidden" />
        {isClient && isMobile && <h1 className="text-lg font-semibold capitalize">{pageTitle}</h1>}
      </div>



      <div className="ml-auto flex items-center gap-1 md:gap-2">
        
        {isClient && !isMobile && (
          <TooltipProvider>
            <div className="hidden md:flex items-center gap-1">
                             <Dialog open={isViewParentDialogOpen} onOpenChange={setIsViewParentDialogOpen}>
                                 <Tooltip>
                         <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full" aria-label={t("header.viewAsParent") || 'View as parent'}>
                                <User className="h-5 w-5" />
                                <span className="sr-only">{t("header.viewAsParent") || 'View as parent'}</span>
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                                        <TooltipContent>{t("header.viewAsParent")}</TooltipContent>
                                </Tooltip>
                                <DialogContent>
                                        <DialogHeader>
                                                <DialogTitle>{t("header.viewParentPortal")}</DialogTitle>
                                                <DialogDescription>Select a grade, then a student to view their parent portal.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            {/* Grade Selector */}
                                            <div>
                                                <Label htmlFor="grade-select">Grade</Label>
                                                <Select
                                                    onValueChange={(grade) => {
                                                        setViewSelectedStudent("");
                                                        setSelectedGrade(grade);
                                                    }}
                                                    value={selectedGrade || ""}
                                                >
                                                    <SelectTrigger id="grade-select">
                                                        <SelectValue placeholder="Select a grade..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {[...new Set(students.map(s => s.grade))].sort().map(grade => (
                                                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {/* Student Selector */}
                                            <div>
                                                <Label htmlFor="student-select">Student</Label>
                                                <Select
                                                    onValueChange={setViewSelectedStudent}
                                                    value={viewSelectedStudent || ""}
                                                    disabled={!selectedGrade}
                                                >
                                                    <SelectTrigger id="student-select">
                                                        <SelectValue placeholder={selectedGrade ? "Select a student..." : "Select a grade first"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {students.filter(s => s.grade === selectedGrade).map(student => (
                                                            <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleViewParentPortal} disabled={!viewSelectedStudent || isLoadingData || isSubmitting}>
                                                {isSubmitting || isLoadingData ? <Loader2 className="animate-spin" /> : <Eye />}
                                                View Portal
                                            </Button>
                                        </DialogFooter>
                                </DialogContent>
                             </Dialog>



               <Dialog open={isViewTeacherDialogOpen} onOpenChange={setIsViewTeacherDialogOpen}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                       <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('header.viewAsTeacher') || 'View as teacher'}>
                                <Briefcase className="h-5 w-5" />
                                <span className="sr-only">{t('header.viewAsTeacher') || 'View as teacher'}</span>
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>عرض كأستاذ</TooltipContent>
                </Tooltip>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>عرض بوابة الأستاذ</DialogTitle>
                        <DialogDescription>اختر أستاذاً لعرض لوحة تحكمه.</DialogDescription>
                    </DialogHeader>
                    <Command>
                      <CommandInput placeholder="ابحث عن المعلمين..." />
                      <CommandList>
                        <CommandEmpty>لم يتم العثور على معلمين.</CommandEmpty>
                        <CommandGroup>
                           {isLoadingData ? <div className="p-4 text-center text-sm">Loading...</div> : staff.filter(s => s.role === 'teacher').map((teacher) => (
                              <CommandItem key={teacher.id} value={teacher.name} onSelect={() => setViewSelectedTeacher(teacher.id)}>
                                <Check className={cn("mr-2 h-4 w-4", viewSelectedTeacher === teacher.id ? "opacity-100" : "opacity-0")} />
                                {teacher.name}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                    <DialogFooter>
                      <Button onClick={handleViewTeacherPortal} disabled={!viewSelectedTeacher || isLoadingData}>
                        {isLoadingData ? <Loader2 className="animate-spin" /> : <Eye />}
                        عرض لوحة التحكم
                      </Button>
                    </DialogFooter>
                </DialogContent>
               </Dialog>

              <Separator orientation="vertical" className="h-6 mx-2" />

              <Tooltip>
                      <TooltipTrigger asChild>
                      <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                                                    onClick={() => router.push('/staff-management/directory/new')}
                                                    aria-label={t('header.addStaff') || 'Add staff'}
                      >
                          <UserPlus className="h-5 w-5" />
                                                 <span className="sr-only">{t('header.addStaff') || 'Add staff'}</span>
                      </Button>
                  </TooltipTrigger>
                 <TooltipContent>إضافة موظف جديد</TooltipContent>
              </Tooltip>
              <Tooltip>
                      <TooltipTrigger asChild>
                      <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                                                    onClick={() => router.push('/academic-management/courses/new')}
                                                    aria-label={t('header.addCourse') || 'Add course'}
                      >
                          <BookOpenCheck className="h-5 w-5" />
                                                 <span className="sr-only">{t('header.addCourse') || 'Add course'}</span>
                      </Button>
                  </TooltipTrigger>
                 <TooltipContent>إضافة مادة جديدة</TooltipContent>
              </Tooltip>
               <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                       <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('header.quickPayments') || 'Quick payments'}>
                                <Receipt />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                     <TooltipContent>دفع سريع للرسوم</TooltipContent>
                </Tooltip>
                <DialogContent>
                    <DialogHeader>
                         <DialogTitle>دفع رسوم سريع</DialogTitle>
                         <DialogDescription>سجل دفعة رسوم جديدة لطالب.</DialogDescription>
                    </DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                             <Label htmlFor="student-select">الطالب</Label>
                             <Popover open={isStudentPopoverOpen} onOpenChange={setIsStudentPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isStudentPopoverOpen}
                                    className="w-full justify-between"
                                    >
                                     {selectedStudent
                                         ? students.find((s) => s.id === selectedStudent)?.name
                                         : "اختر الطالب..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                     <CommandInput placeholder="ابحث عن الطلاب..." />
                                    <CommandList>
                                     <CommandEmpty>لم يتم العثور على طلاب.</CommandEmpty>
                                      <CommandGroup>
                                          {students.map((student) => (
                                          <CommandItem
                                              key={student.id}
                                              value={student.name}
                                              onSelect={() => {
                                                  setSelectedStudent(student.id);
                                                  setIsStudentPopoverOpen(false);
                                              }}
                                          >
                                              <Check
                                              className={cn(
                                                  "mr-2 h-4 w-4",
                                                  selectedStudent === student.id ? "opacity-100" : "opacity-0"
                                              )}
                                              />
                                              {student.name}
                                          </CommandItem>
                                          ))}
                                      </CommandGroup>
                                    </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="amount">المبلغ</Label>
                            <Input id="amount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="month">الدفع عن الشهر</Label>
                            <Select onValueChange={setPaymentMonth} value={paymentMonth}>
                                 <SelectTrigger id="month"><SelectValue placeholder="اختر الشهر..." /></SelectTrigger>
                                <SelectContent>{months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="method">طريقة الدفع</Label>
                            <Select onValueChange={(v: string) => setPaymentMethod(v as "card" | "cash" | "bank-transfer")} defaultValue={paymentMethod}>
                                <SelectTrigger id="method"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="card">بطاقة بنكية</SelectItem>
                                     <SelectItem value="cash">نقدًا</SelectItem>
                                     <SelectItem value="bank-transfer">تحويل بنكي</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                         <Button onClick={handleRecordPayment} disabled={isSubmitting || isLoadingData}>
                             {isSubmitting && <Loader2 className="animate-spin" />}
                             تسجيل الدفعة
                         </Button>
                    </DialogFooter>
                </DialogContent>
               </Dialog>
                        </div>
                    </TooltipProvider>
                )}
        
        {isClient && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full relative">
                    <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-destructive" />
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">{t('header.viewNotifications') || 'View notifications'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                 <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem className="flex items-start gap-3">
                 <FileText className="mt-1" />
                 <div>
                     <p className="font-medium">إعلان جديد</p>
                     <p className="text-xs text-muted-foreground">تم نشر جدول اجتماع أولياء الأمور والمعلمين.</p>
                 </div>
                 </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-start gap-3">
                 <BookOpenCheck className="mt-1" />
                 <div>
                     <p className="font-medium">تسجيل مادة</p>
                     <p className="text-xs text-muted-foreground">تم تسجيل طالب جديد في "الرياضيات المتقدمة".</p>
                 </div>
                 </DropdownMenuItem>
                 <DropdownMenuItem className="flex items-start gap-3">
                 <Briefcase className="mt-1" />
                 <div>
                     <p className="font-medium">تمت معالجة الرواتب</p>
                     <p className="text-xs text-muted-foreground">تمت معالجة رواتب شهر يوليوز 2024 بنجاح.</p>
                 </div>
                 </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem className="text-center text-muted-foreground">
                     <Link href="#">عرض جميع الإشعارات</Link>
                 </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}

        {isClient && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" aria-label={t('header.userMenu') || 'User menu'}>
                <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://picsum.photos/seed/admin/100/100`} alt="Admin" data-ai-hint="profile picture" />
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span className="sr-only">{t('header.userMenu') || 'User menu'}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                 <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
                 <DropdownMenuItem asChild>
                     <Link href="/settings">الإعدادات</Link>
                 </DropdownMenuItem>
                <DropdownMenuSeparator />
                 <DropdownMenuItem>
                     <Link href="/login">تسجيل الخروج</Link>
                 </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
