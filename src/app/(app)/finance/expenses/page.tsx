
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getExpenses, addExpense } from "@/services/financeService";
import { getSettings } from "@/services/settingsService";
import type { Expense } from "@/lib/types";
import { Loader2, PlusCircle, Printer, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  GlassModal,
  GlassModalContent,
  GlassModalDescription,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalTrigger,
} from "@/components/ui/glass-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

const expenseSchema = z.object({
    category: z.enum(["salaries", "utilities", "supplies", "maintenance", "other"]),
    description: z.string().min(3, "Description is required."),
    amount: z.coerce.number().positive("Amount must be a positive number."),
});

export default function ExpensesPage() {
    const { toast } = useToast();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [schoolName, setSchoolName] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof expenseSchema>>({
        resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: "",
            amount: 0,
        },
    });

    const fetchExpenses = async () => {
        setIsLoading(true);
        try {
            const [fetchedExpenses, settings] = await Promise.all([
                getExpenses(dateRange?.from, dateRange?.to),
                getSettings()
            ]);
            setExpenses(fetchedExpenses);
            setSchoolName(settings.schoolName);
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch expenses.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [toast, dateRange]);
    
    async function onSubmit(values: z.infer<typeof expenseSchema>) {
        setIsSubmitting(true);
        try {
            await addExpense({
                ...values,
                date: new Date().toISOString()
            });
            toast({ title: "Expense Added", description: "The new expense has been recorded." });
            fetchExpenses();
            form.reset();
            setIsDialogOpen(false);
        } catch (error) {
             toast({ title: "Error", description: "Failed to add expense.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handlePrint = () => {
        window.print();
    };
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    }
    
    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <>
            <div className="flex flex-col gap-6 no-print">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>Expense Tracker</CardTitle>
                            <CardDescription>
                                Log and view all school expenditures.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[300px] justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                        <>
                                            {format(dateRange.from, "LLL dd, y")} -{" "}
                                            {format(dateRange.to, "LLL dd, y")}
                                        </>
                                        ) : (
                                        format(dateRange.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date range</span>
                                    )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={setDateRange}
                                    numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>

                            <GlassModal open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <GlassModalTrigger asChild>
                                    <Button className="btn-glass-primary btn-click-effect">
                                        <PlusCircle />
                                        Add Expense
                                    </Button>
                                </GlassModalTrigger>
                                <GlassModalContent>
                                    <GlassModalHeader>
                                        <GlassModalTitle>Record New Expense</GlassModalTitle>
                                        <GlassModalDescription>
                                            Enter the details of the expense below.
                                        </GlassModalDescription>
                                    </GlassModalHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl>
                                                        <Textarea className="glass-input" placeholder="e.g., Monthly electricity bill" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="amount"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Amount</FormLabel>
                                                    <FormControl>
                                                        <Input className="glass-input" type="number" placeholder="0.00" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="category"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Category</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select a category" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="salaries">Salaries</SelectItem>
                                                            <SelectItem value="utilities">Utilities</SelectItem>
                                                            <SelectItem value="supplies">Supplies</SelectItem>
                                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <div className="flex justify-end pt-4">
                                                <Button type="submit" disabled={isSubmitting} className="btn-gradient btn-click-effect">
                                                    {isSubmitting && <Loader2 className="animate-spin" />}
                                                    {isSubmitting ? "Adding..." : "Add Expense"}
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </GlassModalContent>
                            </GlassModal>
                            <Button variant="outline" onClick={handlePrint} className="btn-glass btn-click-effect">
                                <Printer />
                                Print
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>
            
            <div className="print-area">
                 <div className="print-header hidden print:block text-center mb-4">
                    <h1 className="text-xl font-bold">{schoolName}</h1>
                    <h2 className="text-lg font-semibold">Expense Report</h2>
                    {dateRange?.from && <p className="text-muted-foreground">
                        For period: {format(dateRange.from, "PPP")} {dateRange.to && ` to ${format(dateRange.to, "PPP")}`}
                    </p>}
                </div>
                <Card>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length > 0 ? (
                                        expenses.map(e => (
                                            <TableRow key={e.id}>
                                                <TableCell>{format(new Date(e.date), 'PPP')}</TableCell>
                                                <TableCell className="font-medium">{e.description}</TableCell>
                                                <TableCell className="capitalize">{e.category}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center h-24">No expenses recorded for this period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-end font-bold text-lg border-t pt-4">
                        <div className="flex items-center gap-4">
                            <span>Total Expenses:</span>
                            <span>{formatCurrency(totalExpenses)}</span>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    )
}
