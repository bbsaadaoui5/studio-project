
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import * as React from "react";
import { getIncomeSummary } from "@/services/financeService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format, subMonths } from "date-fns";

const chartConfig = {
  income: {
    label: "Income (MAD)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function IncomeOverviewChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchIncomeData = async () => {
      try {
        const incomeSummary = await getIncomeSummary();
        
        const now = new Date();
        const monthlyData: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
            const month = format(subMonths(now, i), 'MMMM');
            monthlyData[month] = incomeSummary[month] || 0;
        }

        const data = Object.keys(monthlyData).map(month => ({
            month: month,
            income: monthlyData[month]
        }));

        setChartData(data);
      } catch (error) {
        toast({
            title: "Error",
            description: "Could not fetch income data for chart.",
            variant: "destructive"
        })
      } finally {
        setIsLoading(false);
      }
    }
    fetchIncomeData();
  }, [toast]);

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
