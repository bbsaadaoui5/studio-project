
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getExpenses, addExpense, deleteExpense } from "@/services/financeService";
import { updateExpense } from "@/services/financeService";
import { getSettings } from "@/services/settingsService";
import type { Expense } from "@/lib/types";
import { Loader2, PlusCircle, Printer, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ActionIcons } from "@/components/action-icons";
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
        category: z.enum([
            "salaries", // الرواتب
            "utilities", // الخدمات
            "supplies", // الخدمات
            "maintenance", // الصيانة
            "other" // أخرى
        ]),
        description: z.string().min(3, "الوصف مطلوب"),
        amount: z.coerce.number().positive("المبلغ يجب أن يكون رقمًا موجبًا"),
});

export default function ExpensesPage() {
        const { toast } = useToast();
        const { t } = useTranslation();
        const [expenses, setExpenses] = useState<Expense[]>([]);
        const [dateRange, setDateRange] = useState<DateRange | undefined>();
        const [schoolName, setSchoolName] = useState("");
        const [isLoading, setIsLoading] = useState(true);
        const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
    const [editForm, setEditForm] = useState<{ description: string; amount: number; category: Expense['category'] }>({ description: '', amount: 0, category: 'other' });

        // تعريب أسماء الفئات
        const categoryLabels: Record<string, string> = {
            salaries: "الرواتب",
            utilities: "الخدمات (كهرباء، ماء، إنترنت)",
            supplies: "الخدمات (نظافة، أمن، نقل)",
            maintenance: "الصيانة",
            other: "أخرى"
        };

        const form = useForm<z.infer<typeof expenseSchema>>({
                resolver: zodResolver(expenseSchema),
        defaultValues: {
            description: "",
            amount: 0,
        },
    });

    const fetchExpenses = useCallback(async () => {
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
    }, [dateRange, toast]);

    useEffect(() => {
        fetchExpenses();
    }, [fetchExpenses]);
    
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

    // عند الضغط على تحرير
    const handleEditClick = (expense: Expense) => {
        setExpenseToEdit(expense);
        setEditForm({
            description: expense.description,
            amount: expense.amount,
            category: expense.category
        });
        setEditDialogOpen(true);
    };


    // طباعة
    const handlePrint = () => {
        window.print();
    };

    // عند حفظ التعديل
    const handleEditSave = async () => {
        if (!expenseToEdit || !expenseToEdit.id) return;
        try {
            await updateExpense(expenseToEdit.id, editForm as Partial<Expense>);
            setExpenses(expenses.map(e =>
                e.id === expenseToEdit.id
                    ? {
                        ...e,
                        description: editForm.description,
                        amount: editForm.amount,
                        category: editForm.category as Expense['category']
                    }
                    : e
            ));
            toast({ title: "تم التعديل", description: "تم تحديث بيانات المصروف بنجاح" });
            setEditDialogOpen(false);
            setExpenseToEdit(null);
        } catch (error) {
            toast({ title: "خطأ", description: "فشل في تعديل المصروف", variant: "destructive" });
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
    };

    // Group expenses by month and year
    const expensesByMonth: { [key: string]: number } = {};
    expenses.forEach(e => {
        const d = new Date(e.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        expensesByMonth[key] = (expensesByMonth[key] || 0) + e.amount;
    });

    // حذف مصروف
    const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
    const handleDeleteExpense = async () => {
        if (!expenseToDelete || !expenseToDelete.id) return;
        try {
            await deleteExpense(expenseToDelete.id as string);
            setExpenses(expenses.filter(e => e.id !== expenseToDelete.id));
            toast({ title: "تم الحذف", description: "تم حذف المصروف بنجاح" });
        } catch (error) {
            toast({ title: "خطأ", description: "فشل في حذف المصروف", variant: "destructive" });
        } finally {
            setExpenseToDelete(null);
        }
    };

    // يجب أن يكون return هنا فقط في نهاية الدالة الرئيسية
    return (
        <>
            <div className="flex flex-col gap-6 no-print">
                <Card>
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <CardTitle>تتبع المصروفات</CardTitle>
                            <CardDescription>
                                راقب جميع مصروفات المدرسة وسجل النفقات الجديدة بسهولة
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
                                        <span>اختر فترة زمنية</span>
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
                                        إضافة مصروف
                                    </Button>
                                </GlassModalTrigger>
                                <GlassModalContent>
                                    <GlassModalHeader>
                                        <GlassModalTitle>تسجيل مصروف جديد</GlassModalTitle>
                                        <GlassModalDescription>
                                            أدخل تفاصيل المصروف أدناه
                                        </GlassModalDescription>
                                    </GlassModalHeader>
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>الوصف</FormLabel>
                                                    <FormControl>
                                                        <Textarea className="glass-input" placeholder="الوصف" {...field} />
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
                                                    <FormLabel>المبلغ</FormLabel>
                                                    <FormControl>
                                                        <Input className="glass-input" type="number" placeholder="المبلغ" {...field} />
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
                                                    <FormLabel>الفئة</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="اختر الفئة (مثال: كهرباء، ماء، نظافة، نقل)" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="salaries">الرواتب</SelectItem>
                                                            <SelectItem value="utilities">الخدمات (كهرباء، ماء، إنترنت)</SelectItem>
                                                            <SelectItem value="supplies">الخدمات (نظافة، أمن، نقل)</SelectItem>
                                                            <SelectItem value="maintenance">الصيانة</SelectItem>
                                                            <SelectItem value="other">أخرى</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <div className="flex justify-end pt-4">
                                                <Button type="submit" disabled={isSubmitting} className="btn-gradient btn-click-effect">
                                                    {isSubmitting && <Loader2 className="animate-spin" />}
                                                    {isSubmitting ? 'جاري الإضافة...' : 'إضافة'}
                                                </Button>
                                            </div>
                                        </form>
                                    </Form>
                                </GlassModalContent>
                            </GlassModal>
                            <Button variant="outline" onClick={handlePrint} className="btn-glass btn-click-effect">
                                <Printer />
                                طباعة
                            </Button>
                        </div>
                    </CardHeader>
                </Card>
            </div>
            
            <div className="print-area">
                 <div className="print-header hidden print:block text-center mb-4">
                    <h1 className="text-xl font-bold">{schoolName}</h1>
                    <h2 className="text-lg font-semibold">تقرير المصروفات</h2>
                    {dateRange?.from && <p className="text-muted-foreground">
                        للفترة {format(dateRange.from, "PPP")} {dateRange.to && ` - ${format(dateRange.to, "PPP")}`}
                    </p>}
                </div>
                <Card>
                    <CardContent className="pt-6">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>التاريخ</TableHead>
                                        <TableHead>الوصف</TableHead>
                                        <TableHead>الفئة</TableHead>
                                        <TableHead className="text-right">المبلغ</TableHead>
                                        <TableHead className="text-center">الإجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.length > 0 ? (
                                        expenses.map(e => (
                                            <TableRow key={e.id}>
                                                <TableCell>{format(new Date(e.date), 'PPP')}</TableCell>
                                                <TableCell className="font-medium">{e.description}</TableCell>
                                                <TableCell className="capitalize">{categoryLabels[e.category]}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
                                                <TableCell className="text-center flex gap-2 justify-center">
                                                    <ActionIcons
                                                        onEdit={() => handleEditClick(e)}
                                                        onDelete={() => setExpenseToDelete(e)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : null}
                                    {expenses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">لا توجد مصروفات مسجلة</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            {/* Monthly totals */}
                            {/* حوار تأكيد الحذف */}
                            {expenseToDelete && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                                        <h2 className="font-bold text-lg mb-2">تأكيد الحذف</h2>
                                        <p className="mb-4">هل أنت متأكد أنك تريد حذف هذا المصروف؟</p>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" onClick={() => setExpenseToDelete(null)}>إلغاء</Button>
                                            <Button variant="destructive" onClick={handleDeleteExpense}>حذف</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-6">
                                <h3 className="font-bold text-lg mb-2">إجمالي المصروفات الشهرية</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {Object.keys(expensesByMonth).length > 0 ? (
                                        Object.entries(expensesByMonth).map(([key, value]) => {
                                            const [year, month] = key.split('-');
                                            const date = new Date(Number(year), Number(month) - 1);
                                            return (
                                                <div key={key} className="border rounded p-3 flex flex-col items-center">
                                                    <span className="font-semibold">{t('months.' + date.toLocaleString('en-US', { month: 'long' }).toLowerCase())} {year}</span>
                                                    <span className="text-green-700 font-bold text-xl">{formatCurrency(value)}</span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <span>لا توجد مصروفات مسجلة</span>
                                    )}
                                </div>
                            </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
