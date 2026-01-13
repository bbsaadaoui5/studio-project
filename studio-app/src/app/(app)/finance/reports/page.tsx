
"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { IncomeOverviewChart } from "@/components/charts/income-overview-chart";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { getIncomeSummary, getExpenseSummaryWithSalaries } from "@/services/financeService";
import { useTranslation } from "@/i18n/translation-provider";
import { endOfDay, endOfYear, startOfYear } from "date-fns";

export default function FinancialReportsPage() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 4 }).map((_, idx) => (currentYear - idx).toString()), [currentYear]);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [incomeSummary, setIncomeSummary] = useState<Record<string, number>>({});
  const [expenseSummary, setExpenseSummary] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [filterMode, setFilterMode] = useState<'year' | 'custom'>('year');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const range = useMemo(() => {
    if (filterMode === 'custom') {
      if (customFrom && customTo) {
        const fromDate = new Date(customFrom);
        const toDate = endOfDay(new Date(customTo));
        if (!Number.isNaN(fromDate.getTime()) && !Number.isNaN(toDate.getTime())) {
          return { from: fromDate, to: toDate };
        }
      }
      return { from: undefined, to: undefined };
    }

    const yearNum = Number(selectedYear);
    if (!Number.isFinite(yearNum)) return { from: undefined, to: undefined };
    const refDate = new Date(yearNum, 0, 1);
    return {
      from: startOfYear(refDate),
      to: endOfYear(refDate)
    };
  }, [filterMode, selectedYear, customFrom, customTo]);

  useEffect(() => {
    const fetchTotals = async () => {
      // If custom mode and dates are incomplete, do not fetch
      if (filterMode === 'custom' && (!customFrom || !customTo)) {
        setIncomeSummary({});
        setExpenseSummary({});
        setTotalIncome(0);
        setTotalExpenses(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [incomeData, expenseData] = await Promise.all([
          getIncomeSummary(range.from, range.to),
          getExpenseSummaryWithSalaries(range.from, range.to)
        ]);
        
        setIncomeSummary(incomeData);
        setExpenseSummary(expenseData);

        const income = Object.values(incomeData).reduce((sum, amount) => sum + amount, 0);
        const expenses = Object.values(expenseData).reduce((sum, amount) => sum + amount, 0);
        
        setTotalIncome(income);
        setTotalExpenses(expenses);
      } catch (error) {
        console.error("Error fetching financial totals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTotals();
  }, [filterMode, selectedYear, customFrom, customTo, range.from, range.to]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  };

  const netProfit = totalIncome - totalExpenses;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>التقارير المالية</CardTitle>
          <CardDescription>
            نظرة عامة على الدخل، المصروفات، وصافي الأرباح
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الفلاتر الزمنية</CardTitle>
          <CardDescription>اختَر سنة محددة أو نطاق تاريخ مخصص</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="radio"
                name="range-mode"
                value="year"
                checked={filterMode === 'year'}
                onChange={() => setFilterMode('year')}
                className="accent-primary"
              />
              حسب السنة
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={filterMode !== 'year'}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            >
              {years.map((year) => (
                <option key={year} value={year}>{`السنة ${year}`}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="radio"
                name="range-mode"
                value="custom"
                checked={filterMode === 'custom'}
                onChange={() => setFilterMode('custom')}
                className="accent-primary"
              />
              نطاق تاريخ مخصص
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              disabled={filterMode !== 'custom'}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            />
            <span className="text-sm text-muted-foreground">إلى</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              disabled={filterMode !== 'custom'}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">إجمالي الدخل</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {isLoading ? 'جاري التحميل...' : formatCurrency(totalIncome)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">إجمالي المصروفات</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {isLoading ? 'جاري التحميل...' : formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">صافي الربح/الخسارة</CardTitle>
              <DollarSign className={`h-4 w-4 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {isLoading ? 'جاري التحميل...' : formatCurrency(netProfit)}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">هامش الربح</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? 'جاري التحميل...' : totalIncome > 0 ? `${((netProfit / totalIncome) * 100).toFixed(1)}%` : "0%"}
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              نظرة شهرية على الدخل
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
            <IncomeOverviewChart summary={incomeSummary} isLoading={isLoading} from={range.from} to={range.to} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              توزيع المصروفات
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] w-full">
             <ExpenseBreakdownChart summary={expenseSummary} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
