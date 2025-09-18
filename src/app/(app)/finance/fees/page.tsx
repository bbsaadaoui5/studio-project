
"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getStudents } from "@/services/studentService";
import { getSettings } from "@/services/settingsService";
import { getFeeStructureForGrade, getPaymentsForStudent, recordPayment, updatePayment, deletePayment } from "@/services/financeService";
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

const months = [
  { value: 0, label: "January" }, { value: 1, label: "February" }, { value: 2, label: "March" },
  { value: 3, label: "April" }, { value: 4, label: "May" }, { value: 5, label: "June" },
  { value: 6, label: "July" }, { value: 7, label: "August" }, { value: 8, label: "September" },
  { value: 9, label: "October" }, { value: 10, label: "November" }, { value: 11, label: "December" }
];

export default function FeesPage() {
    const { toast } = useToast();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    
    const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null);
    const [allPayments, setAllPayments] = useState<Payment[]>([]);

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
                toast({ title: "Error", description: "Could not fetch initial data.", variant: "destructive" });
            }
        };
        fetchInitialData();
    }, [toast]);

    const dateRange = useMemo(() => {
        if (startYear === null || startMonth === null || endYear === null || endMonth === null) {
            return undefined;
        }
        const from = startOfMonth(new Date(startYear, startMonth));
        const to = endOfMonth(new Date(endYear, endMonth));
        return { from, to };
    }, [startMonth, startYear, endMonth, endYear]);

    const fetchStudentFeeData = async (studentId: string) => {
        setIsLoading(true);
        try {
            const student = students.find(s => s.id === studentId);
            if (!student) throw new Error("Student not found");

            const [structure, payments] = await Promise.all([
                getFeeStructureForGrade(student.grade, academicYear),
                getPaymentsForStudent(studentId)
            ]);

            setFeeStructure(structure);
            setAllPayments(payments);

        } catch (error) {
             toast({ title: "Error", description: "Could not fetch fee information for this student.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (!selectedStudent) {
            setFeeStructure(null);
            setAllPayments([]);
            return;
        };
        fetchStudentFeeData(selectedStudent.id);
    }, [selectedStudent, academicYear, toast]);
    
   const feeStatus = useMemo(() => {
    if (!feeStructure || !dateRange || !selectedStudent?.enrollmentDate) {
        return null;
    }

    const enrollmentDate = startOfMonth(new Date(selectedStudent.enrollmentDate));
    const monthlyDue = feeStructure.monthlyAmount;
    
    const periodStartDate = dateRange.from;
    const periodEndDate = endOfDay(dateRange.to);

    const inPeriodPayments = allPayments.filter(p => isWithinInterval(new Date(p.date), { start: periodStartDate, end: periodEndDate }));
    const beforePeriodPayments = allPayments.filter(p => isBefore(new Date(p.date), periodStartDate));

    // --- Carry Forward Balance Calculation ---
    // Determine the start date for calculating past dues: either enrollment date or the start of the academic year, whichever is later.
    const academicYearStartDate = startOfYear(periodStartDate); // Simplified; a more robust solution might use a specific settings-defined start date
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
}, [feeStructure, allPayments, dateRange, academicYear, selectedStudent]);


    const paymentsByMonth = useMemo(() => {
         return allPayments.reduce((acc, p) => {
            const monthYear = p.month; // Use the month the payment was for
            acc[monthYear] = (acc[monthYear] || 0) + p.amount;
            return acc;
        }, {} as Record<string, number>);
    }, [allPayments]);


    const handleRecordPayment = async () => {
        if (!selectedStudent || !paymentAmount || paymentAmount <= 0 || !paymentMonth || !dateRange) {
            toast({ title: "Invalid Input", description: "Please select a student, date range, payment month, and enter a valid amount.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await recordPayment({
                studentId: selectedStudent.id,
                amount: Number(paymentAmount),
                date: new Date().toISOString(),
                month: paymentMonth,
                academicYear,
                method: paymentMethod
            });
            toast({ title: "Payment Recorded", description: "The payment has been successfully recorded." });
            
            await fetchStudentFeeData(selectedStudent.id);

            setIsDialogOpen(false);
            setPaymentAmount("");
            setPaymentMonth("");

        } catch (error) {
            toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleEditPayment = async () => {
        if (!paymentToEdit || !paymentAmount || paymentAmount <= 0 || !paymentMonth) {
             toast({ title: "Invalid Input", description: "Please ensure all fields are filled correctly.", variant: "destructive" });
             return;
        }
        setIsSubmitting(true);
        try {
            await updatePayment(paymentToEdit.id, {
                amount: Number(paymentAmount),
                month: paymentMonth,
                method: paymentMethod
            });
            toast({ title: "Payment Updated", description: "The payment has been successfully updated." });
            await fetchStudentFeeData(paymentToEdit.studentId);
            setIsEditDialogOpen(false);
            setPaymentToEdit(null);
        } catch (error) {
            toast({ title: "Error", description: "Failed to update payment.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleDeletePayment = async () => {
        if (!paymentToDelete) return;
        setIsDeleting(true);
        try {
            await deletePayment(paymentToDelete.id);
            toast({ title: "Payment Deleted", description: "The payment record has been removed." });
            await fetchStudentFeeData(paymentToDelete.studentId);
            setPaymentToDelete(null);
        } catch (error) {
             toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
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


    return (
        <>
        <div className="flex flex-col gap-6 no-print">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Fee Management</CardTitle>
                            <CardDescription>
                                Select a student and date range to view their fee statement.
                            </CardDescription>
                        </div>
                         {selectedStudent && dateRange && (
                            <Button onClick={handlePrint} variant="outline" className="btn-glass btn-click-effect">
                                <Printer className="mr-2" />
                                Print Statement
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-end">
                     <div className="flex-1 space-y-2">
                        <Label htmlFor="student-select">Select Student</Label>
                        <Select onValueChange={handleSelectStudent} value={selectedStudent?.id || ""}>
                            <SelectTrigger id="student-select">
                                <SelectValue placeholder="Select a student..." />
                            </SelectTrigger>
                            <SelectContent>
                                {students.map(student => (
                                    <SelectItem key={student.id} value={student.id}>
                                        {student.name} - Grade {student.grade}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2 border p-2 rounded-md">
                        <div>
                            <Label>Start Period</Label>
                            <div className="flex gap-2 mt-2">
                                <Select onValueChange={(v) => setStartMonth(parseInt(v))} value={startMonth !== null ? String(startMonth) : undefined}>
                                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                    <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select onValueChange={(v) => setStartYear(parseInt(v))} value={startYear !== null ? String(startYear) : undefined}>
                                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div>
                            <Label>End Period</Label>
                             <div className="flex gap-2 mt-2">
                                <Select onValueChange={(v) => setEndMonth(parseInt(v))} value={endMonth !== null ? String(endMonth) : undefined}>
                                    <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                    <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                                </Select>
                                <Select onValueChange={(v) => setEndYear(parseInt(v))} value={endYear !== null ? String(endYear) : undefined}>
                                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                    <SelectContent>{yearOptions.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    {(dateRange) && (
                         <Button variant="ghost" size="icon" onClick={clearFilters} className="btn-glass btn-click-effect">
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </CardContent>
            </Card>

            {isLoading && selectedStudent && (
                 <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            
            {(!isLoading && selectedStudent && !dateRange) && (
                <Card>
                    <CardContent className="text-center py-12 text-muted-foreground">
                        <p>Please select a start and end period to view the fee statement.</p>
                    </CardContent>
                </Card>
            )}

            {!isLoading && selectedStudent && dateRange && !feeStructure && (
                <Card>
                    <CardContent className="text-center py-12">
                        <p className="text-lg font-medium text-destructive">No Fee Structure Found</p>
                        <p className="text-muted-foreground">Please set up a fee structure for Grade {selectedStudent.grade} for the {academicYear} academic year.</p>
                        <Button variant="link" asChild><Link href="/finance/structures">Go to Fee Structures</Link></Button>
                    </CardContent>
                </Card>
            )}
        </div>
            
        {(!isLoading && selectedStudent && feeStructure && dateRange && feeStatus) && (
                <div className="print-area">
                    <div className="hidden print:block mb-6 text-center">
                        <h1 className="text-xl font-bold">{schoolName}</h1>
                        <h2 className="text-lg font-semibold">{selectedStudent.name} - Fee Statement</h2>
                        <p>Academic Year: {academicYear}</p>
                         {dateRange?.from && <p className="text-muted-foreground">
                            For period: {format(dateRange.from, "MMMM yyyy")} {dateRange.to && ` to ${format(dateRange.to, "MMMM yyyy")}`}
                        </p>}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1 print:border-none print:shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign />
                                    Fee Summary
                                </CardTitle>
                                <CardDescription>
                                     Financial standing for the selected period.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Due (This Period)</span>
                                    <span className="font-semibold">{formatCurrency(feeStatus.dueInPeriod)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Paid (This Period)</span>
                                    <span className="font-semibold text-green-600">{formatCurrency(feeStatus.paidInPeriod)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Balance (This Period)</span>
                                    <span className={cn("font-semibold", feeStatus.balanceForPeriod < 0 ? 'text-red-600' : 'text-gray-600')}>{formatCurrency(feeStatus.balanceForPeriod)}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Carry-forward Balance</span>
                                    <span className={cn("font-semibold", feeStatus.carryForwardBalance < 0 ? 'text-red-600' : 'text-gray-600')}>{formatCurrency(feeStatus.carryForwardBalance)}</span>
                                </div>
                                <div className="flex justify-between items-center rounded-lg border p-3 bg-muted/50">
                                    <span className="font-bold flex items-center gap-2"><Scale /> Net Balance</span>
                                    <span className={cn("font-bold text-lg", feeStatus.netBalance < 0 ? 'text-red-600' : 'text-gray-600')}>{formatCurrency(feeStatus.netBalance)}</span>
                                </div>
                            </CardContent>
                            <CardFooter className="no-print">
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full btn-gradient btn-click-effect">
                                            <Receipt />
                                            Record a Payment
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Record New Payment</DialogTitle>
                                            <DialogDescription>
                                                Enter payment details for {selectedStudent.name}.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="month">Payment for Month</Label>
                                                <Select onValueChange={setPaymentMonth} value={paymentMonth}>
                                                    <SelectTrigger id="month"><SelectValue placeholder="Select a month..." /></SelectTrigger>
                                                    <SelectContent>{feeStatus.monthsInPeriod.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="amount">Amount</Label>
                                                <Input id="amount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
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
                                            <Button onClick={handleRecordPayment} disabled={isSubmitting} className="btn-gradient btn-click-effect">
                                                {isSubmitting && <Loader2 className="animate-spin" />}
                                                Submit Payment
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardFooter>
                        </Card>

                        <Card className="lg:col-span-2 print:border-none print:shadow-none">
                            <CardHeader>
                                <CardTitle>Monthly Breakdown</CardTitle>
                                <CardDescription>Detailed view of installments and payments for the selected period.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Month</TableHead>
                                            <TableHead>Amount Due</TableHead>
                                            <TableHead>Amount Paid</TableHead>
                                            <TableHead className="text-right">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {feeStatus.monthsInPeriod.filter(monthYear => new Date(monthYear) >= startOfMonth(new Date(selectedStudent.enrollmentDate))).map(monthYear => {
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
                                <h3 className="font-bold text-lg mt-4">Payment History in Period</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Month Applied</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead className="text-right no-print">Actions</TableHead>
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
                                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This action cannot be undone. This will permanently delete the payment record of {formatCurrency(paymentToDelete?.amount || 0)}.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction onClick={handleDeletePayment} disabled={isDeleting}>
                                                                        {isDeleting ? "Deleting..." : "Continue"}
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center h-24">No payments recorded for this period.</TableCell>
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
                        <DialogTitle>Edit Payment</DialogTitle>
                        <DialogDescription>
                            Update the payment details for {selectedStudent?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {paymentToEdit && (
                         <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Original Date: {format(new Date(paymentToEdit.date), "PPP")}</Label>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-month">Payment for Month</Label>
                                <Select onValueChange={setPaymentMonth} value={paymentMonth}>
                                    <SelectTrigger id="edit-month"><SelectValue placeholder="Select a month..." /></SelectTrigger>
                                    <SelectContent>{feeStatus?.monthsInPeriod.map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">Amount</Label>
                                <Input id="edit-amount" type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0.00" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-method">Payment Method</Label>
                                <Select onValueChange={(v) => setPaymentMethod(v as any)} value={paymentMethod}>
                                    <SelectTrigger id="edit-method"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="card">Credit/Debit Card</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="btn-glass btn-click-effect">Cancel</Button>
                        <Button onClick={handleEditPayment} disabled={isSubmitting} className="btn-gradient btn-click-effect">
                            {isSubmitting && <Loader2 className="animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

    

    