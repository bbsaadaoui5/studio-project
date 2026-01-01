"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, AlertCircle } from "lucide-react";
import { getStaffPaymentDueReport, getFinancialSummary, type StaffPaymentDueReport } from "@/services/reportService";
import { cn } from "@/lib/utils";

export default function StaffPaymentDuePage() {
  const { t } = useTranslation();
  const [report, setReport] = useState<StaffPaymentDueReport[]>([]);
  const [summary, setSummary] = useState({
    totalStaffPayableSalaries: 0,
    staffCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportData, summaryData] = await Promise.all([
          getStaffPaymentDueReport(),
          getFinancialSummary(),
        ]);
        setReport(reportData);
        setSummary({
          totalStaffPayableSalaries: summaryData.totalStaffPayableSalaries,
          staffCount: summaryData.staffCount,
        });
      } catch (error) {
        console.error("Error fetching staff payment due report:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    // Set up polling every 5 seconds to refresh data
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-MA", { style: "currency", currency: "MAD" }).format(amount);
  };

  const handleExport = () => {
    const csv = [
      ["Staff Name", "Position", "Department", "Amount Due", "Period", "Status"],
      ...report.map((r) => [
        r.staffName,
        r.position || "-",
        r.department || "-",
        r.totalDueLastPayroll,
        r.lastPayrollPeriod || "-",
        r.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `staff-payment-due-${new Date().toISOString().split("T")[0]}.csv`;
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
        <h1 className="text-3xl font-bold">{t("finance.reports.staffPaymentDue") || "Staff Payment Due"}</h1>
        <p className="text-muted-foreground mt-2">
          {t("finance.reports.staffPaymentDueDesc") || "Track staff salaries that need to be paid."}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              {t("finance.reports.totalPayableSalaries") || "Total Payable Salaries"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalStaffPayableSalaries)}</div>
            <p className="text-xs text-muted-foreground mt-1">Across {summary.staffCount} staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("finance.reports.staffMembersPending") || "Staff Members Pending"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.filter((r) => r.status === "pending").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("finance.reports.averageSalary") || "Average Salary"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.staffCount > 0 ? formatCurrency(summary.totalStaffPayableSalaries / summary.staffCount) : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per staff member</p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("finance.reports.staffPaymentDetails") || "Staff Payment Details"}</CardTitle>
            <CardDescription>
              {report.length} {report.length === 1 ? "staff member" : "staff members"} with pending payments
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
                  <TableHead>{t("common.name") || "Name"}</TableHead>
                  <TableHead>{t("common.position") || "Position"}</TableHead>
                  <TableHead>{t("common.department") || "Department"}</TableHead>
                  <TableHead className="text-right">{t("finance.reports.amountDue") || "Amount Due"}</TableHead>
                  <TableHead>{t("finance.reports.period") || "Period"}</TableHead>
                  <TableHead>{t("common.status") || "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      {t("finance.reports.noPaymentsDue") || "No staff with pending payments."}
                    </TableCell>
                  </TableRow>
                ) : (
                  report.map((row) => (
                    <TableRow key={row.staffId}>
                      <TableCell className="font-medium">{row.staffName}</TableCell>
                      <TableCell>{row.position || "—"}</TableCell>
                      <TableCell>{row.department || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(row.totalDueLastPayroll)}</TableCell>
                      <TableCell className="text-sm">{row.lastPayrollPeriod || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            row.status === "pending"
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          )}
                        >
                          {row.status === "pending"
                            ? t("finance.reports.pending") || "Pending"
                            : t("finance.reports.paid") || "Paid"}
                        </Badge>
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
