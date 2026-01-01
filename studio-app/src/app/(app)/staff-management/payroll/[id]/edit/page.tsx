
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getPayroll, updatePayroll } from "@/services/payrollService";
import type { Payroll, Payslip, PayslipItem } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Save, ReceiptText, Printer, Plus, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { recalculateDeductions } from "@/lib/moroccan-payroll";

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
                toast({ title: t('common.error'), description: t('errors.fetchData'), variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        fetchPayroll();
    }, [id, toast]);

    if (!id) { return <div>{t('common.idNotFound')}</div>; }

    const sumAmount = (items: PayslipItem[]) => items.reduce((sum, item) => sum + (item.amount || 0), 0);

    const recalcPayslip = (p: Payslip): Payslip => {
        const earnings = p.earnings || [];
        const deductions = p.deductions || [];
        const updatedDeductions = recalculateDeductions(earnings, deductions);
        const grossSalary = sumAmount(earnings);
        const totalDeductions = sumAmount(updatedDeductions);
        const netPay = grossSalary - totalDeductions;

        return {
            ...p,
            earnings,
            deductions: updatedDeductions,
            grossSalary,
            totalDeductions,
            netPay,
            baseSalary: earnings.find((e) => e.id === "base-salary")?.amount ?? p.baseSalary ?? 0,
        };
    };

    const handleItemChange = (staffId: string, type: "earning" | "deduction", itemId: string, field: "label" | "amount", value: string) => {
        const updatedPayslips = payslips.map((p) => {
            if (p.staffId !== staffId) return p;
            const listKey = type === "earning" ? "earnings" : "deductions";
            const updatedList = (p[listKey] || []).map((item) => {
                if (item.id !== itemId) return item;
                if (field === "amount") {
                    const numeric = Number(value);
                    if (isNaN(numeric)) return item;
                    return { ...item, amount: numeric };
                }
                return { ...item, label: value };
            });
            return recalcPayslip({ ...p, [listKey]: updatedList });
        });
        setPayslips(updatedPayslips);
    };

    const handleAddItem = (staffId: string, type: "earning" | "deduction") => {
        const updatedPayslips = payslips.map((p) => {
            if (p.staffId !== staffId) return p;
            const listKey = type === "earning" ? "earnings" : "deductions";
            const newItem: PayslipItem = {
                id: `${type}-${Date.now()}`,
                label: type === "earning" ? t("staff.payroll.customItem") : t("staff.payroll.customItem"),
                amount: 0,
                type,
                category: "custom",
            };
            return recalcPayslip({ ...p, [listKey]: [...(p[listKey] || []), newItem] });
        });
        setPayslips(updatedPayslips);
    };

    const handleRemoveItem = (staffId: string, type: "earning" | "deduction", itemId: string) => {
        const updatedPayslips = payslips.map((p) => {
            if (p.staffId !== staffId) return p;
            const listKey = type === "earning" ? "earnings" : "deductions";
            const filtered = (p[listKey] || []).filter((item) => item.id !== itemId);
            return recalcPayslip({ ...p, [listKey]: filtered });
        });
        setPayslips(updatedPayslips);
    };

    const handleRecalculate = () => {
        const recalculated = payslips.map((p) => recalcPayslip(p));
        setPayslips(recalculated);
    };

    const handleSaveChanges = async () => {
        if (!payroll) return;
        setIsSaving(true);
        try {
            const sanitizeItem = (item: PayslipItem) => {
                const clean: any = {
                    id: item.id,
                    label: item.label || "",
                    amount: item.amount ?? 0,
                    type: item.type,
                };
                if (item.category) clean.category = item.category;
                if (item.rate !== undefined) clean.rate = item.rate;
                if (item.taxable !== undefined) clean.taxable = item.taxable;
                if (item.hours !== undefined) clean.hours = item.hours;
                if (item.hourlyRate !== undefined) clean.hourlyRate = item.hourlyRate;
                return clean;
            };

            const sanitizePayslip = (p: Payslip) => {
                const earnings = (p.earnings || []).map(sanitizeItem);
                const deductions = (p.deductions || []).map(sanitizeItem);
                const base: any = {
                    staffId: p.staffId,
                    staffName: p.staffName,
                    period: p.period,
                    baseSalary: p.baseSalary ?? 0,
                    earnings,
                    deductions,
                    grossSalary: p.grossSalary ?? 0,
                    totalDeductions: p.totalDeductions ?? 0,
                    netPay: p.netPay ?? 0,
                };
                if (p.staffPosition) base.staffPosition = p.staffPosition;
                if (p.cnssNumber) base.cnssNumber = p.cnssNumber;
                if (p.cin) base.cin = p.cin;
                if (p.paymentDate) base.paymentDate = p.paymentDate;
                if (p.employerCNSS !== undefined) base.employerCNSS = p.employerCNSS;
                if (p.employerAMO !== undefined) base.employerAMO = p.employerAMO;
                return base as Payslip;
            };

            const normalizedPayslips = payslips.map(recalcPayslip).map(sanitizePayslip);
            const totalAmount = normalizedPayslips.reduce((acc, p) => acc + p.netPay, 0);
            const updatedPayroll = {
                period: payroll.period,
                runDate: payroll.runDate,
                totalAmount,
                payslips: normalizedPayslips,
            };

            await updatePayroll(id, updatedPayroll);
            toast({ title: t('common.success'), description: t('staff.payroll.changesSaved') });
            router.push("/staff-management/payroll");
        } catch (error) {
            toast({ title: t('common.error'), description: t('staff.payroll.failedToSave'), variant: "destructive" });
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
                    <CardTitle>{t('staff.payroll.editingPayrollFor', { period: payroll.period })}</CardTitle>
                    <CardDescription>
                        {t('staff.payroll.editDescription', { runDate: format(new Date(payroll.runDate), "PPP") })}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center gap-4">
                                <Button variant="outline" size="icon" onClick={() => router.back()} aria-label={t('common.back')}>
                                    <ArrowLeft />
                                    <span className="sr-only">{t('common.back')}</span>
                                </Button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" size="sm" className="gap-2" onClick={() => router.push(`/staff-management/payroll/${id}/summary`)}>
                                            <ReceiptText className="h-4 w-4" />
                                            {t('staff.payroll.printSummary')}
                                        </Button>
                                        <Button variant="secondary" size="sm" className="gap-2" onClick={() => router.push(`/staff-management/payroll/${id}/payslip/${payslips[0]?.staffId || ''}`)} disabled={payslips.length === 0}>
                                            <Printer className="h-4 w-4" />
                                            {t('staff.payroll.printPayslip')}
                                        </Button>
                                        <Button variant="outline" size="sm" className="gap-2" onClick={handleRecalculate}>
                                            <RefreshCw className="h-4 w-4" />
                                            {t('staff.payroll.recalculate')}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {payslips.map((p) => (
                                <Card key={p.staffId}>
                                    <CardHeader>
                                        <CardTitle>{p.staffName}</CardTitle>
                                        <CardDescription>
                                            {p.staffPosition ? `${p.staffPosition}` : ""}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold">{t('staff.payroll.earningsBreakdown')}</h3>
                                                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAddItem(p.staffId, 'earning')}>
                                                        <Plus className="h-4 w-4" /> {t('staff.payroll.addEarning')}
                                                    </Button>
                                                </div>
                                                <div className="space-y-3">
                                                    {(p.earnings || []).map((item) => (
                                                        <div key={item.id} className="flex items-center gap-2">
                                                            <Input
                                                                value={item.label}
                                                                onChange={(e) => handleItemChange(p.staffId, 'earning', item.id, 'label', e.target.value)}
                                                                className="w-2/3"
                                                            />
                                                            <Input
                                                                type="number"
                                                                value={item.amount}
                                                                onChange={(e) => handleItemChange(p.staffId, 'earning', item.id, 'amount', e.target.value)}
                                                                className="w-1/3"
                                                            />
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(p.staffId, 'earning', item.id)} aria-label={t('staff.payroll.remove')}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-semibold">{t('staff.payroll.deductionsBreakdown')}</h3>
                                                    <Button size="sm" variant="outline" className="gap-1" onClick={() => handleAddItem(p.staffId, 'deduction')}>
                                                        <Plus className="h-4 w-4" /> {t('staff.payroll.addDeduction')}
                                                    </Button>
                                                </div>
                                                <div className="space-y-3">
                                                    {(p.deductions || []).map((item) => (
                                                        <div key={item.id} className="flex items-center gap-2">
                                                            <Input
                                                                value={item.label}
                                                                onChange={(e) => handleItemChange(p.staffId, 'deduction', item.id, 'label', e.target.value)}
                                                                className="w-2/3"
                                                            />
                                                            <Input
                                                                type="number"
                                                                value={item.amount}
                                                                onChange={(e) => handleItemChange(p.staffId, 'deduction', item.id, 'amount', e.target.value)}
                                                                className="w-1/3"
                                                            />
                                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(p.staffId, 'deduction', item.id)} aria-label={t('staff.payroll.remove')}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
                                            <div>
                                                <p className="text-sm text-muted-foreground">{t('staff.payroll.grossSalary')}</p>
                                                <p className="text-lg font-semibold">{formatCurrency(p.grossSalary || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">{t('staff.payroll.totalDeductions')}</p>
                                                <p className="text-lg font-semibold">{formatCurrency(p.totalDeductions || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">{t('staff.payroll.netPay')}</p>
                                                <p className="text-lg font-semibold">{formatCurrency(p.netPay || 0)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => router.push(`/staff-management/payroll/${id}/summary`)}>
                                    <ReceiptText className="mr-2 h-4 w-4" />
                                    {t('staff.payroll.printSummary')}
                                </Button>
                                <Button variant="outline" onClick={() => router.push(`/staff-management/payroll/${id}/payslip/${payslips[0]?.staffId || ''}`)} disabled={payslips.length === 0}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    {t('staff.payroll.printPayslip')}
                                </Button>
                                <Button onClick={handleSaveChanges} disabled={isSaving}>
                                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    <Save className="mr-2 h-4 w-4" />
                                    {isSaving ? t('common.saving') : t('common.saveChanges')}
                                </Button>
                            </div>
                        </div>
                </CardContent>
            </Card>
        </div>
    );
}

