
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getPayroll } from "@/services/payrollService";
import { getSettings } from "@/services/settingsService";
import type { Payroll, Payslip, SchoolSettings } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Loader2, Printer, ArrowLeft, Building } from "lucide-react";
import { format } from "date-fns";

export default function PayrollSummaryPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const payrollId = params.id as string;

    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!payrollId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [payrollData, settingsData] = await Promise.all([
                    getPayroll(payrollId),
                    getSettings()
                ]);

                if (!payrollData || !settingsData) {
                    notFound();
                    return;
                }
                
                setPayroll(payrollData);
                setSettings(settingsData);

            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch payroll data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [payrollId, toast]);

    const handlePrint = () => {
        window.print();
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }
    
    if (isLoading || !payroll || !settings) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    return (
        <>
            <div className="flex flex-col gap-6 no-print">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" onClick={() => router.back()}>
                            <ArrowLeft />
                            <span className="sr-only">Back</span>
                        </Button>
                        <h1 className="text-2xl font-bold">Payroll Summary</h1>
                    </div>
                    <Button onClick={handlePrint}>
                        <Printer />
                        Print Summary
                    </Button>
                </div>
            </div>
            
            <div className="print-area">
                 <div className="print-header hidden print:block text-center mb-4">
                    <h1 className="text-xl font-bold">{settings.schoolName}</h1>
                </div>
                <Card id="summary-content" className="w-full max-w-4xl mx-auto print:border-none print:shadow-none">
                    <CardHeader className="bg-muted/30 print:bg-transparent">
                        <div className="flex justify-between items-start">
                            <div className="no-print">
                                <div className="flex items-center gap-2 mb-2">
                                    <Building />
                                    <CardTitle className="text-2xl">{settings.schoolName}</CardTitle>
                                </div>
                                <CardDescription>Payroll Summary for {payroll.period}</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold">Run Date</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(payroll.runDate), "PPP")}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                    <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Staff Name</TableHead>
                                    <TableHead>Base Salary</TableHead>
                                    <TableHead>Bonus</TableHead>
                                    <TableHead>Deductions</TableHead>
                                    <TableHead className="text-right font-bold">Net Pay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payroll.payslips.map(p => (
                                    <TableRow key={p.staffId}>
                                        <TableCell className="font-medium">{p.staffName}</TableCell>
                                        <TableCell>{formatCurrency(p.salary)}</TableCell>
                                        <TableCell>{formatCurrency(p.bonus)}</TableCell>
                                        <TableCell>{formatCurrency(p.deductions)}</TableCell>
                                        <TableCell className="text-right font-semibold">{formatCurrency(p.netPay)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                    </Table>
                    <Separator className="my-6" />
                    <div className="flex justify-end">
                            <div className="w-full max-w-xs space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Payroll Amount</span>
                                    <span>{formatCurrency(payroll.totalAmount)}</span>
                                </div>
                            </div>
                    </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
