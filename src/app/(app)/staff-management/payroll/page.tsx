
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Wallet, History, ReceiptText, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
    const [payrollToDelete, setPayrollToDelete] = useState<Payroll | null>(null);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const history = await getPayrolls();
            setPayrollHistory(history);
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch payroll history.", variant: "destructive" });
        } finally {
            setIsLoadingHistory(false);
        }
    }

    useEffect(() => {
        fetchHistory();
    }, [toast]);

    const handleRunPayroll = async () => {
        setIsGenerating(true);
        try {
            const currentMonthYear = format(new Date(), "MMMM yyyy");
            const result = await generatePayroll(currentMonthYear);
            
            if (result.success) {
                 toast({
                    title: "Payroll Generated",
                    description: `Successfully ran payroll for ${currentMonthYear}.`,
                });
                await fetchHistory(); // Refresh history
            } else {
                 toast({
                    title: "Could Not Run Payroll",
                    description: result.reason,
                    variant: "destructive",
                });
            }
        } catch(error) {
            console.error("An unexpected error occurred in handleRunPayroll:", error);
            toast({ 
                title: "An Unknown Error Occurred", 
                description: "Failed to run payroll due to an unexpected error. Please try again.", 
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
            toast({ title: "Payroll Deleted", description: `Payroll for ${payrollToDelete.period} has been deleted.`});
            fetchHistory();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete payroll.", variant: "destructive" });
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
                    <CardTitle>Staff Payroll</CardTitle>
                    <CardDescription>
                        Generate and manage payroll for all active staff members.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="p-8 border-4 border-dashed border-muted rounded-lg text-center">
                        <Wallet className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">Run Payroll for {format(new Date(), "MMMM yyyy")}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            This will calculate salaries, deductions, and net pay for all active staff.
                        </p>
                        <Button className="mt-6" onClick={handleRunPayroll} disabled={isGenerating}>
                            {isGenerating && <Loader2 className="animate-spin" />}
                            {isGenerating ? "Generating..." : "Run Payroll"}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History />
                        Payroll History
                    </CardTitle>
                    <CardDescription>
                       View previously generated payrolls.
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
                                    <TableHead>Period</TableHead>
                                    <TableHead>Run Date</TableHead>
                                    <TableHead className="text-right">Total Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payrollHistory.length > 0 ? (
                                    payrollHistory.map((payroll) => (
                                        <TableRow key={payroll.id}>
                                            <TableCell className="font-medium">{payroll.period}</TableCell>
                                            <TableCell>{format(new Date(payroll.runDate), "PPP")}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(payroll.totalAmount)}</TableCell>
                                            <TableCell className="text-right">
                                                 <Button variant="outline" size="sm" onClick={() => router.push(`/staff-management/payroll/${payroll.id}/edit`)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                 </Button>
                                                  <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="ml-2" onClick={() => setPayrollToDelete(payroll)}>
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will permanently delete the payroll record for {payrollToDelete?.period}. This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel onClick={() => setPayrollToDelete(null)}>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={handleDeletePayroll}>Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No payroll history found.
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
