
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, notFound, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getPayroll } from "@/services/payrollService";
import { getStaffMember } from "@/services/staffService";
import { getSettings } from "@/services/settingsService";
import type { Payroll, Payslip, Staff, SchoolSettings } from "@/lib/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2, Printer, ArrowLeft, Building, User } from "lucide-react";
import { format } from "date-fns";

export default function PayslipPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const payrollId = params.id as string;
    const staffId = params.staffId as string;

    const [payslip, setPayslip] = useState<Payslip | null>(null);
    const [payroll, setPayroll] = useState<Payroll | null>(null);
    const [staff, setStaff] = useState<Staff | null>(null);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!payrollId || !staffId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [payrollData, staffData, settingsData] = await Promise.all([
                    getPayroll(payrollId),
                    getStaffMember(staffId),
                    getSettings()
                ]);

                if (!payrollData || !staffData || !settingsData) {
                    notFound();
                    return;
                }

                const payslipData = payrollData.payslips.find(p => p.staffId === staffId);
                if (!payslipData) {
                    notFound();
                    return;
                }
                
                setPayroll(payrollData);
                setStaff(staffData);
                setPayslip(payslipData);
                setSettings(settingsData);

            } catch (error) {
                toast({ title: "Error", description: "Failed to fetch payslip data.", variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [payrollId, staffId, toast]);

    const handlePrint = () => {
        window.print();
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }
    
    if (isLoading || !payslip || !payroll || !staff || !settings) {
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
                    <h1 className="text-2xl font-bold">Payslip Details</h1>
                </div>
                <Button onClick={handlePrint}>
                    <Printer />
                    Print Payslip
                </Button>
            </div>
        </div>
            
            <div className="print-area">
                <Card id="payslip-content" className="w-full max-w-3xl mx-auto print:border-none print:shadow-none">
                    <CardHeader className="bg-muted/30 print:bg-transparent">
                         <div className="print-header hidden print:block text-center mb-4">
                            <h1 className="text-xl font-bold">{settings.schoolName}</h1>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-2 no-print">
                                    <Building />
                                    <CardTitle className="text-2xl">{settings.schoolName}</CardTitle>
                                </div>
                                <CardDescription>Payslip for {payroll.period}</CardDescription>
                            </div>
                            <div className="text-right">
                                <p className="font-bold">{staff.name}</p>
                                <p className="text-sm text-muted-foreground">{staff.role}</p>
                                <p className="text-sm text-muted-foreground">Staff ID: {staff.id}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-2">Earnings</h3>
                                <div className="flex justify-between"><span>Base Salary</span><span>{formatCurrency(payslip.salary)}</span></div>
                                <div className="flex justify-between"><span>Bonus</span><span>{formatCurrency(payslip.bonus)}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold"><span>Total Earnings</span><span>{formatCurrency(payslip.salary + payslip.bonus)}</span></div>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg border-b pb-2 mb-2">Deductions</h3>
                                <div className="flex justify-between"><span>Standard Deductions</span><span>{formatCurrency(payslip.deductions)}</span></div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-bold"><span>Total Deductions</span><span>{formatCurrency(payslip.deductions)}</span></div>
                            </div>
                        </div>
                        <Separator className="my-6" />
                        <div className="bg-primary/10 p-4 rounded-lg flex justify-between items-center print:bg-gray-100">
                            <h3 className="text-xl font-bold text-primary print:text-black">Net Pay</h3>
                            <p className="text-2xl font-extrabold text-primary print:text-black">{formatCurrency(payslip.netPay)}</p>
                        </div>
                    </CardContent>
                    <CardFooter className="text-xs text-muted-foreground">
                        <p>Payslip generated on {format(new Date(payroll.runDate), "PPP")}. This is a computer-generated document.</p>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
