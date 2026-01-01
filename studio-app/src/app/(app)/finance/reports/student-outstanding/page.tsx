"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Download, DollarSign } from "lucide-react";
import { getStudentOutstandingReport, getFinancialSummary, type StudentOutstandingReport } from "@/services/reportService";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function StudentOutstandingFeesPage() {
  const { t } = useTranslation();
  const [report, setReport] = useState<StudentOutstandingReport[]>([]);
  const [summary, setSummary] = useState({
    totalStudentOutstanding: 0,
    totalStudentDue: 0,
    totalStudentPaid: 0,
    studentCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportData, summaryData] = await Promise.all([
          getStudentOutstandingReport(),
          getFinancialSummary(),
        ]);
        setReport(reportData);
        setSummary(summaryData);
      } catch (error) {
        console.error("Error fetching student outstanding report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-MA", { style: "currency", currency: "MAD" }).format(amount);
  };

  const handleExport = () => {
    const csv = [
      ["Student Name", "Grade", "Total Due", "Total Paid", "Outstanding Balance"],
      ...report.map((r) => [
        r.studentName,
        r.grade,
        r.totalDue,
        r.totalPaid,
        r.outstandingBalance,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `student-outstanding-fees-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">{t("finance.reports.studentOutstanding") || "Student Outstanding Fees"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("finance.reports.studentOutstandingDesc") || "View all students with unpaid fees."}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("finance.reports.totalOutstanding") || "Total Outstanding"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalStudentOutstanding)}</div>
            <p className="text-xs text-muted-foreground mt-1">Due from {summary.studentCount} students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("finance.reports.totalDue") || "Total Due"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalStudentDue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Calculated through today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("finance.reports.totalPaid") || "Total Paid"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalStudentPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">All payments recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("finance.reports.collectionRate") || "Collection Rate"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalStudentDue > 0
                ? Math.round((summary.totalStudentPaid / summary.totalStudentDue) * 100)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Paid vs. due</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("finance.reports.detailedList") || "Detailed List"}</CardTitle>
            <CardDescription>
              {report.length} {report.length === 1 ? "student" : "students"} with outstanding fees
            </CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t("common.export") || "Export"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.student") || "Student"}</TableHead>
                  <TableHead>{t("common.grade") || "Grade"}</TableHead>
                  <TableHead className="text-right">{t("finance.reports.totalDue") || "Total Due"}</TableHead>
                  <TableHead className="text-right">{t("finance.reports.totalPaid") || "Total Paid"}</TableHead>
                  <TableHead className="text-right">{t("finance.reports.outstanding") || "Outstanding"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      {t("finance.reports.noOutstandingFees") || "No students with outstanding fees."}
                    </TableCell>
                  </TableRow>
                ) : (
                  report.map((row) => (
                    <TableRow key={row.studentId}>
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      <TableCell>{row.grade}</TableCell>
                      <TableCell className="text-right">{formatCurrency(row.totalDue)}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(row.totalPaid)}</TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-semibold",
                          row.outstandingBalance > 0 ? "text-red-600" : "text-gray-500"
                        )}
                      >
                        {formatCurrency(row.outstandingBalance)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
