
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, LineChart } from "lucide-react";
import { IncomeOverviewChart } from "@/components/charts/income-overview-chart";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";

export default function FinancialReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Financial Reports</CardTitle>
          <CardDescription>
            An overview of the school's financial performance, including income from fees and expenditures.
          </CardDescription>
        </CardHeader>
      </Card>
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Income Overview (Monthly)
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
              Expense Breakdown
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
