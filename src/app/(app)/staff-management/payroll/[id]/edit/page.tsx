
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getPayroll, updatePayroll } from "@/services/payrollService";
import type { Payroll, Payslip } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Save, ReceiptText, Printer } from "lucide-react";
import { format } from "date-fns";

export default function EditPayrollPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();

    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    // hooks/effects before early return
    useEffect(() => {
        if (!id) return;
        const fetchPayroll = async () => {
            setIsLoading(true);
            try {
                const data = await getPayroll(id);
                if (data) {
                    setPayroll(data);
                    setPayslips(data.payslips);
                } else {
                    notFound();
                }
            } catch (error) {
                toast({ title: "خطأ", description: "فشل في جلب بيانات الرواتب", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayroll();
    }, [id, toast]);

    if (!id) { return <div>لم يتم العثور على رقم الهوية</div>; }

    const handlePayslipChange = (staffId: string, field: keyof Payslip, value: string) => {
        const numericValue = Number(value);
        if (isNaN(numericValue)) return;

        const updatedPayslips = payslips.map(p => {
            if (p.staffId === staffId) {
                const updatedPayslip = { ...p, [field]: numericValue };
                // Recalculate net pay
                updatedPayslip.netPay = (updatedPayslip.salary || 0) + (updatedPayslip.bonus || 0) - (updatedPayslip.deductions || 0);
                return updatedPayslip;
            }
            return p;
        });
        setPayslips(updatedPayslips);
    };

    const handleSaveChanges = async () => {
        if (!payroll) return;
        setIsSaving(true);
        try {
            const totalAmount = payslips.reduce((acc, p) => acc + p.netPay, 0);
            const updatedPayroll = { ...payroll, payslips, totalAmount };
            
            await updatePayroll(id, updatedPayroll);
            toast({ title: "تم تحديث الرواتب", description: "تم حفظ التغييرات بنجاح" });
            router.push("/staff-management/payroll");
        } catch (error) {
            toast({ title: "خطأ", description: "فشل في حفظ التغييرات.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }
    
    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }
    
    if (!payroll) {
        return notFound();
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                <Link href="/staff-management/payroll">
                    <ArrowLeft />
                    <span className="sr-only">{t("common.backToPayroll") || 'Back to payroll'}</span>
                </Link>
                </Button>
                <h1 className="text-2xl font-bold">{t("staff.payroll.editPayrollTitle")}</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Editing Payroll for {payroll.period}</CardTitle>
                    <CardDescription>
                        Run Date: {format(new Date(payroll.runDate), "PPP")}. Adjust payslip details below as needed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t("staff.payroll.staffName")}</TableHead>
                                    <TableHead>{t("staff.payroll.baseSalary")}</TableHead>
                                    <TableHead>{t("staff.payroll.bonus")}</TableHead>
                                    <TableHead>{t("staff.payroll.deductionsTitle")}</TableHead>
                                    <TableHead>{t("staff.payroll.netPay")}</TableHead>
                                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payslips.map(p => (
                                    <TableRow key={p.staffId}>
                                        <TableCell className="font-medium">{p.staffName}</TableCell>
                                        <TableCell>
                                            <Input type="number" value={p.salary || 0} onChange={e => handlePayslipChange(p.staffId, 'salary', e.target.value)} className="w-32" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={p.bonus || 0} onChange={e => handlePayslipChange(p.staffId, 'bonus', e.target.value)} className="w-32" />
                                        </TableCell>
                                        <TableCell>
                                            <Input type="number" value={p.deductions || 0} onChange={e => handlePayslipChange(p.staffId, 'deductions', e.target.value)} className="w-32" />
                                        </TableCell>
                                        <TableCell className="font-bold">{formatCurrency(p.netPay)}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="outline" size="sm" asChild>
                                                <Link href={`/staff-management/payroll/${id}/payslip/${p.staffId}`}>
                                                    <ReceiptText />
                                                    View Payslip
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                     <div className="mt-6 flex justify-between items-center">
                        <Button variant="outline" asChild>
                           <Link href={`/staff-management/payroll/${id}/summary`}>
                                <Printer />
                                Print Summary
                           </Link>
                        </Button>
                        <Button onClick={handleSaveChanges} disabled={isSaving}>
                            {isSaving && <Loader2 className="animate-spin" />}
                            <Save />
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
