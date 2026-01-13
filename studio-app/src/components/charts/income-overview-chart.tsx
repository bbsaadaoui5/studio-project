
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import * as React from "react";
import { Loader2 } from "lucide-react";
import { addMonths, format, startOfMonth, subMonths } from "date-fns";

const chartConfig = {
  income: {
    label: "Income (MAD)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

type IncomeOverviewChartProps = {
  summary: Record<string, number>;
  isLoading: boolean;
  from?: Date;
  to?: Date;
};

export function IncomeOverviewChart({ summary, isLoading, from, to }: IncomeOverviewChartProps) {
  const months = React.useMemo(() => {
    if (from && to) {
      const normalizedStart = startOfMonth(from);
      const result: string[] = [];
      let cursor = normalizedStart;
      while (cursor <= to) {
        result.push(format(cursor, 'MMMM'));
        cursor = addMonths(cursor, 1);
      }
      return result;
    }

    const now = new Date();
    return Array.from({ length: 6 }).map((_, idx) => format(subMonths(now, 5 - idx), 'MMMM'));
  }, [from, to]);

  const chartData = React.useMemo(() => (
    months.map(month => ({ month, income: summary[month] || 0 }))
  ), [months, summary]);

  if (isLoading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin" /></div>
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="income" fill="var(--color-income)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
