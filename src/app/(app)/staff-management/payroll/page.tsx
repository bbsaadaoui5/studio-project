
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Wallet, History, ReceiptText, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { generatePayroll, getPayrolls, deletePayroll } from "@/services/payrollService";
import type { Payroll, Payslip } from "@/lib/types";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useRouter } from "next/navigation";


export default function PayrollPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
    const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null);

    const fetchHistory = useCallback(async () => {
        setIsLoadingHistory(true);
        try {
            const history = await getPayrolls();
            setPayrollHistory(history);
        } catch (error) {
            toast({ title: "خطأ", description: "حدث خطأ أثناء جلب بيانات الرواتب", variant: "destructive" });
        } finally {
            setIsLoadingHistory(false);
        }
    }, [toast]);

    useEffect(() => {
        void fetchHistory();
    }, [fetchHistory]);

    const handleRunPayroll = async () => {
        setIsGenerating(true);
        try {
            const currentMonthYear = format(new Date(), "MMMM yyyy");
            const result = await generatePayroll(currentMonthYear);
            
            if (result.success) {
                 toast({
                    title: "تم تحديث الرواتب",
                    description: "تم حفظ التغييرات بنجاح",
                });
                await fetchHistory(); // Refresh history
            } else {
                 toast({
                    title: "خطأ",
                    description: result.reason,
                    variant: "destructive",
                });
            }
        } catch(error) {
            console.error("An unexpected error occurred in handleRunPayroll:", error);
            toast({ 
                title: "خطأ غير متوقع", 
                description: "حدث خطأ غير متوقع", 
                variant: "destructive" 
            });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleDeletePayroll = async () => {
        if (!payrollToDelete) return;
        try {
            await deletePayroll(payrollToDelete.id);
            toast({ title: t('common.success'), description: t('staff.payroll.changesSaved')});
            fetchHistory();
        } catch (error) {
            toast({ title: t('common.error'), description: t('staff.payroll.failedToSave'), variant: "destructive" });
        } finally {
            setPayrollToDelete(null);
        }
    }

     const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>سجل الرواتب</CardTitle>
                    <CardDescription>
                        يمكنك إدارة وإنشاء الرواتب للموظفين هنا
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-8 border-4 border-dashed border-muted rounded-lg text-center">
                        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">إنشاء الرواتب لشهر {format(new Date(), "MMMM yyyy")}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            يمكنك إنشاء الرواتب للموظفين لهذا الشهر
                        </p>
                        <Button className="mt-6 btn-gradient btn-click-effect" onClick={handleRunPayroll} disabled={isGenerating}>
                            {isGenerating && <Loader2 className="animate-spin" />}
                            {isGenerating ? "جاري الإنشاء..." : "إنشاء الرواتب"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History />
                        سجل الرواتب السابقة
                    </CardTitle>
                    <CardDescription>
                       عرض الرواتب السابقة
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     {isLoadingHistory ? (
                         <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>الفترة</TableHead>
                                    <TableHead>تاريخ التنفيذ</TableHead>
                                    <TableHead className="text-right">المبلغ الإجمالي</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrollHistory.length > 0 ? (
                                    payrollHistory.map((payroll) => (
                                        <TableRow key={payroll.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/staff-management/payroll/${payroll.id}/summary`)}>
                                            <TableCell className="font-medium">{payroll.period}</TableCell>
                                            <TableCell>{format(new Date(payroll.runDate), "PPP")}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(payroll.totalAmount)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-1">
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/staff-management/payroll/${payroll.id}/summary`); }} className="btn-glass btn-click-effect" aria-label="View payroll summary">
                                                        <ReceiptText className="mr-2 h-4 w-4" />
                                                        View
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/staff-management/payroll/${payroll.id}/edit`); }} className="btn-glass btn-click-effect" aria-label="Edit payroll">
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </Button>
                                                    <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="btn-glass btn-click-effect" onClick={(e) => { e.stopPropagation(); setPayrollToDelete(payroll); }} aria-label={t('staff.payroll.deletePayroll')}>
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                                <span className="sr-only">{t('staff.payroll.deletePayroll')}</span>
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    سيتم حذف سجل الرواتب للفترة {payrollToDelete?.period} بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel onClick={() => setPayrollToDelete(null)}>إلغاء</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleDeletePayroll}>حذف</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            لا يوجد سجلات رواتب سابقة
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                     )}
                </CardContent>
            </Card>
        </div>
    )
}
