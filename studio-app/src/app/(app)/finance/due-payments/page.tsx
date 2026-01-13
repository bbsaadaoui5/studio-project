"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getDueSummary, getOverduePayments, type StudentDuePayment, type StaffDuePayment } from "@/services/dueDateService";
import { Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";

export default function DuePaymentsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [year, setYear] = useState<string>(currentYear.toString());
  const [month, setMonth] = useState<string>(String(currentMonth).padStart(2, '0'));
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [overdue, setOverdue] = useState<any>(null);

  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [summaryData, overdueData] = await Promise.all([
          getDueSummary(Number(year), Number(month)),
          getOverduePayments()
        ]);
        setSummary(summaryData);
        setOverdue(overdueData);
      } catch (error) {
        toast({ title: t('common.error'), description: "تعذر تحميل المستحقات", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [year, month, toast, t]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">مدفوع</Badge>;
      case 'overdue':
        return <Badge variant="destructive">متأخر</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">معلق</Badge>;
      default:
        return <Badge>غير معروف</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>تقرير المستحقات المالية</CardTitle>
          <CardDescription>تتبع رسوم الطلاب (أول الشهر) ورواتب الموظفين (آخر الشهر)</CardDescription>
        </CardHeader>
      </Card>

      {/* Overdue Alert */}
      {overdue && (overdue.overdueStudents.length > 0 || overdue.overdueStaff.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              تنبيه: مستحقات متأخرة
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {overdue.overdueStudents.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">الطلاب: {overdue.overdueStudents.length} طالب</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(overdue.totalOverdueStudentAmount)}</p>
              </div>
            )}
            {overdue.overdueStaff.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">الموظفين: {overdue.overdueStaff.length} موظف</p>
                <p className="text-lg font-bold text-red-700">{formatCurrency(overdue.totalOverdueStaffAmount)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>اختر الفترة الزمنية</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 flex-wrap">
          <div>
            <label className="text-sm font-medium">السنة</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }).map((_, idx) => {
                  const y = currentYear - idx;
                  return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                })}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">الشهر</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((m, idx) => (
                  <SelectItem key={m} value={m}>{monthNames[idx]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {summary && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Students Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👨‍🎓 رسوم الطلاب (أول الشهر)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الطلاب</p>
                    <p className="text-2xl font-bold">{summary.students.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المدفوع</p>
                    <p className="text-2xl font-bold text-green-600">{summary.students.paid}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المعلق</p>
                    <p className="text-2xl font-bold text-yellow-600">{summary.students.pending}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المتأخر</p>
                    <p className="text-2xl font-bold text-red-600">{summary.students.overdue}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">الإجمالي المتوقع</p>
                  <p className="text-xl font-bold">{formatCurrency(summary.students.totalAmount)}</p>
                  <p className="text-sm text-muted-foreground mt-2">المجموع المحصل</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(summary.students.totalCollected)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Staff Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  👔 رواتب الموظفين (آخر الشهر)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">إجمالي الموظفين</p>
                    <p className="text-2xl font-bold">{summary.staff.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المدفوع</p>
                    <p className="text-2xl font-bold text-green-600">{summary.staff.paid}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المعلق</p>
                    <p className="text-2xl font-bold text-yellow-600">{summary.staff.pending}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المتأخر</p>
                    <p className="text-2xl font-bold text-red-600">{summary.staff.overdue}</p>
                  </div>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">الإجمالي المستحق</p>
                  <p className="text-xl font-bold">{formatCurrency(summary.staff.totalAmount)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Tabs */}
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students">تفاصيل الطلاب ({summary.students.total})</TabsTrigger>
              <TabsTrigger value="staff">تفاصيل الموظفين ({summary.staff.total})</TabsTrigger>
            </TabsList>

            {/* Students Details */}
            <TabsContent value="students">
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم الطالب</TableHead>
                          <TableHead>الصف</TableHead>
                          <TableHead>الفصل</TableHead>
                          <TableHead className="text-right">الرسم المستحق</TableHead>
                          <TableHead className="text-right">المبلغ المدفوع</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.studentDetails && summary.studentDetails.length > 0 ? (
                          summary.studentDetails.map((student: StudentDuePayment) => (
                            <TableRow key={student.studentId}>
                              <TableCell className="font-medium">{student.studentName}</TableCell>
                              <TableCell>{student.grade}</TableCell>
                              <TableCell>{student.className}</TableCell>
                              <TableCell className="text-right">{formatCurrency(student.monthlyFee)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(student.amountPaid || 0)}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  {getStatusIcon(student.status)}
                                  {getStatusBadge(student.status)}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                              لا توجد بيانات
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Staff Details */}
            <TabsContent value="staff">
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم الموظف</TableHead>
                          <TableHead>الوظيفة</TableHead>
                          <TableHead className="text-right">الراتب</TableHead>
                          <TableHead>تاريخ الدفع</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {summary.staffDetails && summary.staffDetails.length > 0 ? (
                          summary.staffDetails.map((staff: StaffDuePayment) => (
                            <TableRow key={staff.staffId}>
                              <TableCell className="font-medium">{staff.staffName}</TableCell>
                              <TableCell>{staff.position}</TableCell>
                              <TableCell className="text-right">{formatCurrency(staff.salary)}</TableCell>
                              <TableCell>{staff.paymentDate ? new Date(staff.paymentDate).toLocaleDateString('ar-SA') : '—'}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  {getStatusIcon(staff.status)}
                                  {getStatusBadge(staff.status)}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                              لا توجد بيانات
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
