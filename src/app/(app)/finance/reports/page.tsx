
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { IncomeOverviewChart } from "@/components/charts/income-overview-chart";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { getIncomeSummary, getExpenseSummaryWithSalaries } from "@/services/financeService";
import { useTranslation } from "@/i18n/translation-provider";

export default function FinancialReportsPage() {
  const { t } = useTranslation();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const [incomeData, expenseData] = await Promise.all([
          getIncomeSummary(),
          getExpenseSummaryWithSalaries()
        ]);
        
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
  }, []);

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
            <IncomeOverviewChart />
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
             <ExpenseBreakdownChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
