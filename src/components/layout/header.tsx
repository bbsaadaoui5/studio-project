
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
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

export function Header() {
    // Add state for selectedGrade (for parent portal dialog)
    const [selectedGrade, setSelectedGrade] = useState<string>("");
    const pathname = usePathname();
    const router = useRouter();
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
        router.push(`/teacher/dashboard?teacherId=${viewSelectedTeacher}`);
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
                                                        <Button variant="ghost" size="icon" className="rounded-full">
                                                                <User className="h-5 w-5" />
                                                                <span className="sr-only">View as Parent</span>
                                                        </Button>
                                                </DialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>View as Parent</TooltipContent>
                                </Tooltip>
                                <DialogContent>
                                        <DialogHeader>
                                                <DialogTitle>View Parent Portal</DialogTitle>
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
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Briefcase className="h-5 w-5" />
                                <span className="sr-only">View as Teacher</span>
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>View as Teacher</TooltipContent>
                </Tooltip>
                 <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Teacher Portal</DialogTitle>
                        <DialogDescription>Select a teacher to view their dashboard.</DialogDescription>
                    </DialogHeader>
                    <Command>
                      <CommandInput placeholder="Search teachers..." />
                      <CommandList>
                        <CommandEmpty>No teacher found.</CommandEmpty>
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
                        View Dashboard
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
                      >
                          <UserPlus className="h-5 w-5" />
                          <span className="sr-only">Add New Staff</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add New Staff</TooltipContent>
              </Tooltip>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <Button 
                          variant="ghost" 
                          size="icon" 
                          className="rounded-full" 
                          onClick={() => router.push('/academic-management/courses/new')}
                      >
                          <BookOpenCheck className="h-5 w-5" />
                          <span className="sr-only">Add New Course</span>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add New Course</TooltipContent>
              </Tooltip>
               <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                 <Tooltip>
                    <TooltipTrigger asChild>
                       <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Receipt />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Quick Fee Payment</TooltipContent>
                </Tooltip>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Quick Fee Payment</DialogTitle>
                        <DialogDescription>Record a new fee payment for a student.</DialogDescription>
                    </DialogHeader>
                     <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                             <Label htmlFor="student-select">Student</Label>
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
                                        : "Select student..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                    <CommandInput placeholder="Search students..." />
                                    <CommandList>
                                      <CommandEmpty>No student found.</CommandEmpty>
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
                            <Label htmlFor="amount">Amount</Label>
                            <Input id="amount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="month">Payment for Month</Label>
                            <Select onValueChange={setPaymentMonth} value={paymentMonth}>
                                <SelectTrigger id="month"><SelectValue placeholder="Select a month..." /></SelectTrigger>
                                <SelectContent>{months.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="method">Payment Method</Label>
                            <Select onValueChange={(v) => setPaymentMethod(v as any)} defaultValue={paymentMethod}>
                                <SelectTrigger id="method"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleRecordPayment} disabled={isSubmitting || isLoadingData}>
                            {isSubmitting && <Loader2 className="animate-spin" />}
                            Record Payment
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
                    <span className="sr-only">Toggle notifications</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-start gap-3">
                <FileText className="mt-1" />
                <div>
                    <p className="font-medium">New Announcement</p>
                    <p className="text-xs text-muted-foreground">"Parent-Teacher Meeting Schedule" has been published.</p>
                </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start gap-3">
                <BookOpenCheck className="mt-1" />
                <div>
                    <p className="font-medium">Course Enrollment</p>
                    <p className="text-xs text-muted-foreground">A new student has enrolled in "Advanced Mathematics".</p>
                </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-start gap-3">
                <Briefcase className="mt-1" />
                <div>
                    <p className="font-medium">Payroll Processed</p>
                    <p className="text-xs text-muted-foreground">Monthly payroll for July 2024 has been successfully processed.</p>
                </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-muted-foreground">
                    <Link href="#">View all notifications</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}

        {isClient && (
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://picsum.photos/seed/admin/100/100`} alt="Admin" data-ai-hint="profile picture" />
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <Link href="/login">Logout</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        )}
      </div>
    </header>
  );
}
