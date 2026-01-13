"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getStudents } from "@/services/studentService";
import { getSettings } from "@/services/settingsService";
import { getFeeStructureForGrade, getPaymentsForStudent, recordPayment, updatePayment, deletePayment, getCombinedMonthlyDueForStudent } from "@/services/financeService";
import type { Student, FeeStructure, Payment } from "@/lib/types";
import { Loader2, DollarSign, Receipt, Printer, X, TrendingUp, TrendingDown, Scale, Edit, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, getYear, getMonth, set, isBefore, differenceInCalendarMonths, addMonths, isWithinInterval, startOfYear, endOfDay } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { cn } from "@/lib/utils";



export default function FeesPage() {
    const { t } = useTranslation();
    // Localized labels and months (use i18n keys)
    const pageTitle = t('finance.feeManagement.title');
    const pageDescription = t('finance.feeManagement.description');

    const months = [
      { value: 0, label: t('months.january') },
      { value: 1, label: t('months.february') },
      { value: 2, label: t('months.march') },
      { value: 3, label: t('months.april') },
      { value: 4, label: t('months.may') },
      { value: 5, label: t('months.june') },
      { value: 6, label: t('months.july') },
      { value: 7, label: t('months.august') },
      { value: 8, label: t('months.september') },
      { value: 9, label: t('months.october') },
      { value: 10, label: t('months.november') },
      { value: 11, label: t('months.december') }
    ];

    const tableHeaders = {
        student: t('common.student'),
        grade: t('common.grade'),
        amount: t('common.amount'),
        status: t('common.status'),
        actions: t('common.actions')
    };
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    
    const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);
    const [gradeMonthly, setGradeMonthly] = useState<number>(0);
    const [supportMonthly, setSupportMonthly] = useState<number>(0);
    const [combinedMonthly, setCombinedMonthly] = useState<number>(0);

    const [academicYear, setAcademicYear] = useState("");
    const [schoolName, setSchoolName] = useState("");

    const [startMonth, setStartMonth] = useState<number | null>(null);
    const [startYear, setStartYear] = useState<number | null>(null);
    const [endMonth, setEndMonth] = useState<number | null>(null);
    const [endYear, setEndYear] = useState<number | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<number | "">("");
    const [paymentMonth, setPaymentMonth] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | "bank-transfer">("card");
    const [multiMonthEnabled, setMultiMonthEnabled] = useState<boolean>(false);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);

    // State for editing and deleting payments
    const [paymentToEdit, setPaymentToEdit] = useState<Payment | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [fetchedStudents, settings] = await Promise.all([
                    getStudents(),
                    getSettings()
                ]);
                setStudents(fetchedStudents.filter(s => s.status === 'active'));
                setAcademicYear(settings.academicYear);
                setSchoolName(settings.schoolName);
            } catch (error) {
                toast({ title: t('common.error'), description: t('finance.errors.fetchData') || 'Could not fetch initial data.', variant: "destructive" });
            }
        };
        fetchInitialData();
    }, [toast, t]);

    const dateRange = useMemo(() => {
        if (startYear === null || startMonth === null || endYear === null || endMonth === null) {
            return undefined;
        }
        const from = startOfMonth(new Date(startYear, startMonth));
        const to = endOfMonth(new Date(endYear, endMonth));
        return { from, to };
    }, [startMonth, startYear, endMonth, endYear]);

    const fetchStudentFeeData = useCallback(async (studentId: string) => {
        setIsLoading(true);
        try {
            const student = students.find(s => s.id === studentId);
            if (!student) throw new Error("Student not found");

            // تحقق من صحة القيم قبل جلب هيكل الرسوم
            if (!student.grade || student.grade === "N/A" || !academicYear || academicYear === "N/A") {
                toast({ title: "تنبيه", description: "لا يمكن جلب هيكل الرسوم بسبب نقص أو خطأ في بيانات المستوى أو السنة الدراسية.", variant: "destructive" });
                setIsLoading(false);
                return;
            }

            const [structure, payments] = await Promise.all([
                getFeeStructureForGrade(student.grade, academicYear),
                getPaymentsForStudent(studentId),
                getCombinedMonthlyDueForStudent(studentId, academicYear)
            ]);

            setFeeStructure(structure);
            setAllPayments(payments);
            // the helper returns grade/support/combined
            // when called in Promise.all the third item is the totals object
            // but because Promise.all returns an array we need to extract it
            // from the resolved promises above. We already have structure and payments,
            // so call helper separately for clarity (avoid destructuring mismatch).
            const totals = await getCombinedMonthlyDueForStudent(studentId, academicYear);
            setGradeMonthly(totals.gradeMonthly || 0);
            setSupportMonthly(totals.supportMonthly || 0);
            setCombinedMonthly(totals.combinedMonthly || 0);

        } catch (error) {
             toast({ title: t('common.error'), description: t('finance.feeManagement.errorFetchingFeeInfo'), variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [students, academicYear, toast, t]);


    useEffect(() => {
        if (!selectedStudent) {
            setFeeStructure(null);
            setAllPayments([]);
            return;
        };
        fetchStudentFeeData(selectedStudent.id);
    }, [selectedStudent, fetchStudentFeeData]);
    
   const feeStatus = useMemo(() => {
    if (!feeStructure || !selectedStudent?.enrollmentDate) {
        return null;
    }

    const enrollmentDate = startOfMonth(new Date(selectedStudent.enrollmentDate));
    const monthlyDue = feeStructure.monthlyAmount;
    
    // If no date range is selected, show all payment history
    if (!dateRange) {
        const today = new Date();
        const monthsInPeriod: Date[] = [];
        let current = startOfMonth(enrollmentDate);
        while (current <= endOfMonth(today)) {
            monthsInPeriod.push(current);
            current = addMonths(current, 1);
        }

        const dueInPeriod = monthsInPeriod.length * monthlyDue;
        const paidInPeriod = allPayments.reduce((sum, p) => sum + p.amount, 0);
        const balanceForPeriod = paidInPeriod - dueInPeriod;

        return {
            dueInPeriod,
            paidInPeriod,
            balanceForPeriod,
            carryForwardBalance: 0,
            netBalance: balanceForPeriod,
            monthsInPeriod: monthsInPeriod.map(d => format(d, 'MMMM yyyy')),
            inPeriodPayments: allPayments,
        };
    }
    
    // If date range is selected, calculate for that range
    const periodStartDate = dateRange.from;
    const periodEndDate = endOfDay(dateRange.to);

    const inPeriodPayments = allPayments.filter(p => isWithinInterval(new Date(p.date), { start: periodStartDate, end: periodEndDate }));
    const beforePeriodPayments = allPayments.filter(p => isBefore(new Date(p.date), periodStartDate));

    // --- Carry Forward Balance Calculation ---
    const academicYearStartDate = startOfYear(periodStartDate);
    let dueCalculationStartDate = enrollmentDate > academicYearStartDate ? enrollmentDate : academicYearStartDate;
    
    let monthsDueBeforeCount = 0;
    if (isBefore(dueCalculationStartDate, periodStartDate)) {
      monthsDueBeforeCount = differenceInCalendarMonths(periodStartDate, dueCalculationStartDate);
    }
    
    const dueBeforePeriod = monthsDueBeforeCount * monthlyDue;
    const paidBeforePeriodTotal = beforePeriodPayments.reduce((sum, p) => sum + p.amount, 0);
    const carryForwardBalance = paidBeforePeriodTotal - dueBeforePeriod;

    // --- Period Balance Calculation ---
    const monthsInPeriod: Date[] = [];
    let current = startOfMonth(periodStartDate);
    while (current <= endOfMonth(periodEndDate)) {
        monthsInPeriod.push(current);
        current = addMonths(current, 1);
    }
    
    const dueInPeriod = monthsInPeriod.filter(m => m >= enrollmentDate).length * monthlyDue;
    const paidInPeriod = inPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
    const balanceForPeriod = paidInPeriod - dueInPeriod;
    
    const netBalance = carryForwardBalance + balanceForPeriod;
    
    return { 
        dueInPeriod,
        paidInPeriod,
        balanceForPeriod,
        carryForwardBalance,
        netBalance,
        monthsInPeriod: monthsInPeriod.map(d => format(d, 'MMMM yyyy')),
        inPeriodPayments,
    };
}, [feeStructure, allPayments, dateRange, selectedStudent]);


    const paymentsByMonth = useMemo(() => {
        return allPayments.reduce((acc, p) => {
            const monthYear = p.month; // Use the month the payment was for
            acc[monthYear] = (acc[monthYear] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [allPayments]);

    const handleEditPayment = async () => {
        if (!paymentToEdit || !paymentAmount || paymentAmount <= 0 || !paymentMonth) {
             toast({ title: t('finance.feeManagement.invalidInput'), description: t('finance.feeManagement.invalidInput'), variant: "destructive" });
             return;
        }
        setIsSubmitting(true);
        try {
            await updatePayment(paymentToEdit.id, {
                amount: Number(paymentAmount),
                month: paymentMonth,
                method: paymentMethod
            });
            toast({ title: t('finance.feeManagement.paymentUpdated'), description: t('finance.feeManagement.paymentUpdated') });
            await fetchStudentFeeData(paymentToEdit.studentId);
            setIsEditDialogOpen(false);
            setPaymentToEdit(null);
        } catch (error) {
            toast({ title: t('common.error'), description: t('finance.feeManagement.errorUpdatingPayment'), variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleDeletePayment = async () => {
        if (!paymentToDelete) return;
        setIsDeleting(true);
        try {
            await deletePayment(paymentToDelete.id);
            toast({ title: t('finance.success.paymentDeleted'), description: t('finance.success.paymentDeletedDesc') });
            await fetchStudentFeeData(paymentToDelete.studentId);
            setPaymentToDelete(null);
        } catch (error) {
             toast({ title: t('common.error'), description: t('finance.errors.deletePayment'), variant: "destructive" });
        } finally {
            setIsDeleting(false);
        }
    }

    const openEditDialog = (payment: Payment) => {
        setPaymentToEdit(payment);
        setPaymentAmount(payment.amount);
        setPaymentMonth(payment.month);
        setPaymentMethod(payment.method);
        setIsEditDialogOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }
    
    const handlePrint = () => {
      window.print();
    };

    const handleSelectStudent = (studentId: string) => {
        const student = students.find(s => s.id === studentId) || null;
        setSelectedStudent(student);
    }

    const clearFilters = () => {
        setStartMonth(null);
        setStartYear(null);
        setEndMonth(null);
        setEndYear(null);
    }
    
    const yearOptions = useMemo(() => {
        if (!academicYear) return [];
        const currentYear = parseInt(academicYear.split('-')[0]);
        return Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    }, [academicYear]);

    // إضافة دالة تسجيل الدفع
    const handleRecordPayment = async () => {
        setIsSubmitting(true);
        try {
            if (!selectedStudent || !paymentMethod) {
                toast({ title: t('common.error'), description: t('finance.feeManagement.invalidInput'), variant: "destructive" });
                setIsSubmitting(false);
                return;
            }

            if (multiMonthEnabled) {
                if (selectedMonths.length === 0) {
                    toast({ title: t('common.error'), description: t('finance.feeManagement.selectMonth'), variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }

                const totalAmount = paymentAmount !== "" ? Number(paymentAmount) : 0;
                const perMonthDefault = (combinedMonthly || feeStructure?.monthlyAmount || 0);
                const monthsCount = selectedMonths.length;

                let perMonthAmounts: number[];
                if (totalAmount > 0) {
                    const base = Math.floor((totalAmount / monthsCount) * 100) / 100;
                    const amounts = Array(monthsCount).fill(base);
                    // distribute remainder cents to last month
                    const distributed = amounts.reduce((s, a) => s + a, 0);
                    const remainder = Math.round((totalAmount - distributed) * 100) / 100;
                    amounts[monthsCount - 1] = Math.round((amounts[monthsCount - 1] + remainder) * 100) / 100;
                    perMonthAmounts = amounts;
                } else {
                    perMonthAmounts = Array(monthsCount).fill(perMonthDefault);
                }

                for (let i = 0; i < monthsCount; i++) {
                    await recordPayment({
                        studentId: selectedStudent.id,
                        amount: perMonthAmounts[i],
                        month: selectedMonths[i],
                        method: paymentMethod,
                        date: new Date().toISOString(),
                        academicYear: academicYear,
                    });
                }
                toast({ title: t('finance.feeManagement.paymentRecorded'), description: t('finance.feeManagement.paymentRecordedDesc') });
                setIsDialogOpen(false);
                setPaymentAmount("");
                setPaymentMonth("");
                setSelectedMonths([]);
                setMultiMonthEnabled(false);
                setPaymentMethod("card");
            } else {
                if (!paymentAmount || !paymentMonth) {
                    toast({ title: t('common.error'), description: t('finance.feeManagement.invalidInput'), variant: "destructive" });
                    setIsSubmitting(false);
                    return;
                }
                await recordPayment({
                    studentId: selectedStudent.id,
                    amount: Number(paymentAmount),
                    month: paymentMonth,
                    method: paymentMethod,
                    date: new Date().toISOString(),
                    academicYear: academicYear,
                });
                toast({ title: t('finance.feeManagement.paymentRecorded'), description: t('finance.feeManagement.paymentRecordedDesc') });
                setIsDialogOpen(false);
                setPaymentAmount(""
                );
                setPaymentMonth("");
                setPaymentMethod("card");
            }
        } catch (error) {
            toast({ title: t('common.error'), description: t('finance.feeManagement.errorRecordingPayment'), variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
        <div className="flex flex-col gap-6 no-print">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>{t('finance.feeManagement.title')}</CardTitle>
                            <CardDescription>{pageDescription}</CardDescription>
                        </div>
                         {selectedStudent && dateRange && (
                            <Button onClick={handlePrint} variant="outline" className="btn-glass btn-click-effect">
                                <Printer className="mr-2" />
                                {t('finance.feeManagement.printStatement')}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 space-y-2">
                        <Label htmlFor="student-select">{t('finance.feeManagement.selectStudent')}</Label>
                        <Select onValueChange={handleSelectStudent} value={selectedStudent?.id || ""}>
                            <SelectTrigger id="student-select">
                                <SelectValue placeholder={t('finance.feeManagement.selectStudentPlaceholder')} />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map(student => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.name} - {t('common.grade')} {student.grade}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2 border p-2 rounded-md">
                        <div>
                            <Label>{t('finance.feeManagement.startPeriod')}</Label>
                            <div className="flex gap-2 mt-2">
                                <Select onValueChange={(v) => setStartMonth(parseInt(v))} value={startMonth !== null ? String(startMonth) : undefined}>
                                    <SelectTrigger><SelectValue placeholder={t('finance.feeManagement.selectMonth')} /></SelectTrigger>
                                    <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select onValueChange={(v) => setStartYear(parseInt(v))} value={startYear !== null ? String(startYear) : undefined}>
                                    <SelectTrigger><SelectValue placeholder={t('finance.feeManagement.year')} /></SelectTrigger>
                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div>
                            <Label>{t('finance.feeManagement.endPeriod')}</Label>
                             <div className="flex gap-2 mt-2">
                                <Select onValueChange={(v) => setEndMonth(parseInt(v))} value={endMonth !== null ? String(endMonth) : undefined}>
                                    <SelectTrigger><SelectValue placeholder={t('finance.feeManagement.selectMonth')} /></SelectTrigger>
                                    <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select onValueChange={(v) => setEndYear(parseInt(v))} value={endYear !== null ? String(endYear) : undefined}>
                                    <SelectTrigger><SelectValue placeholder={t('finance.feeManagement.year')} /></SelectTrigger>
                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    {(dateRange) && (
                         <Button variant="ghost" size="icon" onClick={clearFilters} className="btn-glass btn-click-effect" aria-label={t('common.clearFilters') || 'Clear filters'}>
                            <X className="h-4 w-4" />
                            <span className="sr-only">{t('common.clearFilters') || 'Clear filters'}</span>
                        </Button>
                    )}
                </CardContent>
            </Card>

            {isLoading && selectedStudent && (
                 <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            
            {!isLoading && selectedStudent && !feeStructure && (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-lg font-medium text-destructive">{t('finance.feeManagement.noFeeStructureFound')}</p>
                        <p className="text-muted-foreground">{t('finance.feeManagement.selectPeriodToViewStatement')}</p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && students.length === 0 && (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-lg font-medium">{t('common.noData')}</p>
                        <p className="text-muted-foreground">لم يتم العثور على أي طلاب نشطين. يرجى إضافة طلاب أولاً.</p>
                        <Link href="/students">
                            <Button className="mt-4 btn-gradient btn-click-effect">
                                إذهب إلى إدارة الطلاب
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}
        </div>
            
        {(!isLoading && selectedStudent && feeStructure && feeStatus) && (
                <div className="print-area">
                    <div className="hidden print:block mb-6 text-center">
                        <h1 className="text-xl font-bold">{schoolName}</h1>
                        <h2 className="text-lg font-semibold">{selectedStudent.name} - {t('finance.feeManagement.feeStatement')}</h2>
                        <p>العام الأكاديمي: {academicYear}</p>
                         {dateRange?.from && <p className="text-muted-foreground">
                            للفترة: {format(dateRange.from, "MMMM yyyy")} {dateRange.to && ` إلى ${format(dateRange.to, "MMMM yyyy")}`}
                        </p>}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1 print:border-none print:shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign />
                                    {t('finance.feeManagement.feeSummary')}
                                </CardTitle>
                                <CardDescription>
                                    {t('finance.feeManagement.financialStatusForPeriod')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">{t('finance.feeManagement.gradeMonthlyLabel') || 'Grade monthly'}</span>
                                        <span className="font-semibold">{formatCurrency(gradeMonthly)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">{t('finance.feeManagement.supportMonthlyLabel') || 'Support courses monthly'}</span>
                                        <span className="font-semibold">{formatCurrency(supportMonthly)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">{t('finance.feeManagement.totalMonthlyLabel') || 'Total monthly due'}</span>
                                        <span className="font-semibold">{formatCurrency(combinedMonthly || feeStructure?.monthlyAmount || 0)}</span>
                                    </div>
                                    <Separator />
                                 <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('finance.feeManagement.dueThisPeriod')}</span>
                                    <span className="font-semibold">{formatCurrency(feeStatus.dueInPeriod)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('finance.feeManagement.paidThisPeriod')}</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(feeStatus.paidInPeriod)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('finance.feeManagement.balanceThisPeriod')}</span>
                                    <span className={cn("font-semibold", feeStatus.balanceForPeriod < 0 ? 'text-red-600' : 'text-gray-600')}>{formatCurrency(feeStatus.balanceForPeriod)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('finance.feeManagement.carryForwardBalance')}</span>
                                    <span className={cn("font-semibold", feeStatus.carryForwardBalance < 0 ? 'text-red-600' : 'text-gray-600')}>{formatCurrency(feeStatus.carryForwardBalance)}</span>
                                </div>
                                <div className="flex justify-between items-center rounded-lg border p-3 bg-muted/50">
                                    <span className="font-bold flex items-center gap-2"><Scale /> {t('finance.feeManagement.netBalance')}</span>
                                    <span className={cn("font-bold text-lg", feeStatus.netBalance < 0 ? 'text-red-600' : 'text-gray-600')}>{formatCurrency(feeStatus.netBalance)}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="no-print">
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full btn-gradient btn-click-effect">
                                            <Receipt />
                                            {t('finance.feeManagement.addPayment')}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{t('finance.feeManagement.addPayment')}</DialogTitle>
                                            <DialogDescription>
                                                {t('finance.payment.enterDetails', { name: selectedStudent?.name })}
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="month">{t('finance.feeManagement.paymentMonth')}</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Checkbox id="multi-month" checked={multiMonthEnabled} onCheckedChange={(v) => setMultiMonthEnabled(Boolean(v))} />
                                                        <span className="text-sm text-muted-foreground">{t('finance.feeManagement.selectMultipleMonths') || 'Select multiple months (optional)'}</span>
                                                    </div>
                                                </div>
                                                {!multiMonthEnabled ? (
                                                    <Select onValueChange={setPaymentMonth} value={paymentMonth}>
                                                        <SelectTrigger id="month"><SelectValue placeholder={t('finance.feeManagement.selectMonth')} /></SelectTrigger>
                                                        <SelectContent>{feeStatus.monthsInPeriod.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
                                                    </Select>
                                                ) : (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-auto border rounded-md p-2">
                                                        {feeStatus.monthsInPeriod.map((month) => {
                                                            const checked = selectedMonths.includes(month);
                                                            return (
                                                                <label key={month} className="flex items-center gap-2 text-sm">
                                                                    <Checkbox
                                                                        checked={checked}
                                                                        onCheckedChange={(v) => {
                                                                            const isChecked = Boolean(v);
                                                                            setSelectedMonths((prev) => {
                                                                                if (isChecked) {
                                                                                    return Array.from(new Set([...prev, month]));
                                                                                } else {
                                                                                    return prev.filter(m => m !== month);
                                                                                }
                                                                            });
                                                                        }}
                                                                    />
                                                                    <span>{month}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">{t('finance.feeManagement.amount')}</Label>
                                                <Input id="amount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="method">{t('finance.feeManagement.paymentMethod')}</Label>
                                                <Select onValueChange={(v: string) => setPaymentMethod(v as "card" | "cash" | "bank-transfer")} defaultValue={paymentMethod}>
                                                    <SelectTrigger id="method"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="card">{t('finance.feeManagement.creditCard')}</SelectItem>
                                                        <SelectItem value="cash">{t('finance.feeManagement.cash')}</SelectItem>
                                                        <SelectItem value="bank-transfer">{t('finance.feeManagement.bankTransfer')}</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleRecordPayment} disabled={isSubmitting} className="btn-gradient btn-click-effect">
                                                {isSubmitting && <Loader2 className="animate-spin" />}
                                                {t('finance.feeManagement.recordPayment')}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>

                        <Card className="lg:col-span-2 print:border-none print:shadow-none">
                            <CardHeader>
                                <CardTitle>{t('finance.feeManagement.monthlyBreakdown')}</CardTitle>
                                <CardDescription>{t('finance.feeManagement.detailedInstallmentsView')}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('common.month')}</TableHead>
                                            <TableHead>{t('finance.feeManagement.amountDue')}</TableHead>
                                            <TableHead>{t('finance.feeManagement.amountPaid')}</TableHead>
                                            <TableHead className="text-right">{t('finance.feeManagement.balance')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {feeStatus.monthsInPeriod
                                            .filter(monthYear => new Date(monthYear) >= startOfMonth(new Date(selectedStudent.enrollmentDate)))
                                            .filter(monthYear => {
                                                const paid = paymentsByMonth[monthYear] || 0;
                                                return paid > 0; // Only show months with actual payments
                                            })
                                            .map(monthYear => {
                                            const paid = paymentsByMonth[monthYear] || 0;
                                            const balance = feeStructure!.monthlyAmount - paid;
                                            return (
                                            <TableRow key={monthYear}>
                                                <TableCell className="font-medium">{monthYear}</TableCell>
                                                <TableCell>{formatCurrency(feeStructure!.monthlyAmount)}</TableCell>
                                                <TableCell className="text-green-600">{formatCurrency(paid)}</TableCell>
                                                <TableCell className={`text-right font-semibold ${balance > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                                    {formatCurrency(balance)}
                                                </TableCell>
                                            </TableRow>
                                        )})}
                                    </TableBody>
                                </Table>
                                 <Separator className="my-4" />
                                 <h3 className="font-bold text-lg mt-4">{t('finance.feeManagement.paymentHistoryInPeriod')}</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('common.date')}</TableHead>
                                            <TableHead>{t('finance.feeManagement.monthApplied')}</TableHead>
                                            <TableHead>{t('common.paymentMethod')}</TableHead>
                                            <TableHead>{t('common.amount')}</TableHead>
                                            <TableHead className="text-right no-print">{t('common.actions')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {feeStatus.inPeriodPayments.length > 0 ? (
                                            feeStatus.inPeriodPayments.map(p => (
                                                <TableRow key={p.id}>
                                                    <TableCell>{format(new Date(p.date), 'PPP')}</TableCell>
                                                    <TableCell>{p.month}</TableCell>
                                                    <TableCell className="capitalize">{p.method.replace('-', ' ')}</TableCell>
                                                    <TableCell>{formatCurrency(p.amount)}</TableCell>
                                                    <TableCell className="text-right no-print">
                                                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(p)} className="btn-glass btn-click-effect">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                         <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" onClick={() => setPaymentToDelete(p)} className="btn-glass btn-click-effect">
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        {t('common.cannotUndo')} {t('finance.payment.deleteConfirmation', { amount: formatCurrency(paymentToDelete?.amount || 0) })}
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={handleDeletePayment} disabled={isDeleting}>
                                                                        {isDeleting ? t('common.deleting') : t('common.continue')}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24">{t('finance.feeManagement.noPaymentsForPeriod')}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
             {/* Edit Payment Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('finance.feeManagement.editPayment')}</DialogTitle>
                        <DialogDescription>
                            {t('finance.feeManagement.updatePaymentDetailsFor', { name: selectedStudent?.name })}
                        </DialogDescription>
                    </DialogHeader>
                    {paymentToEdit && (
                         <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>{t('finance.feeManagement.originalDate')}: {format(new Date(paymentToEdit.date), "PPP")}</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-month">{t('finance.feeManagement.paymentForMonth')}</Label>
                                <Select onValueChange={setPaymentMonth} value={paymentMonth}>
                                    <SelectTrigger id="edit-month"><SelectValue placeholder={t('header.selectAMonth')} /></SelectTrigger>
                                    <SelectContent>{feeStatus?.monthsInPeriod.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">{t('common.amount')}</Label>
                                <Input id="edit-amount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-method">{t('common.paymentMethod')}</Label>
                                <Select onValueChange={(v: string) => setPaymentMethod(v as "card" | "cash" | "bank-transfer")} value={paymentMethod}>
                                    <SelectTrigger id="edit-method"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="card">{t('common.creditCard')}</SelectItem>
                                        <SelectItem value="cash">{t('common.cash')}</SelectItem>
                                        <SelectItem value="bank-transfer">{t('common.bankTransfer')}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="btn-glass btn-click-effect">{t('common.cancel')}</Button>
                        <Button onClick={handleEditPayment} disabled={isSubmitting} className="btn-gradient btn-click-effect">
                            {isSubmitting && <Loader2 className="animate-spin" />}
                            {t('common.saveChanges')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}



