
"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { getExpenseSummary } from "@/services/financeService"

export function ExpenseBreakdownChart() {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchExpenseData = async () => {
            try {
                const expenseSummary = await getExpenseSummary();
                const data = Object.keys(expenseSummary).map((key, index) => ({
                    name: key.charAt(0).toUpperCase() + key.slice(1),
                    value: expenseSummary[key],
                    fill: `hsl(var(--chart-${index + 1}))`
                }));
                setChartData(data);

                const config = {
                    value: {
                        label: "Expenses (MAD)",
                    },
                    ...data.reduce((acc, entry) => {
                        acc[entry.name as keyof typeof acc] = {
                            label: entry.name,
                            color: entry.fill,
                        };
                        return acc;
                    }, {} as ChartConfig),
                } satisfies ChartConfig;
                setChartConfig(config);

            } catch (error) {
                 toast({
                    title: "Error",
                    description: "Could not fetch expense data for charts.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchExpenseData();
    }, [toast]);
    
    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin" /></div>
    }
    
    if (chartData.length === 0 && !isLoading) {
        return <div className="flex h-full w-full items-center justify-center text-muted-foreground">No expense data to display.</div>
    }

    return (
        <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square h-full"
        >
        <PieChart>
            <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
            />
            <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                strokeWidth={5}
            >
            </Pie>
            <ChartLegend
                content={<ChartLegendContent nameKey="name" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/3 [&>*]:justify-center"
            />
        </PieChart>
        </ChartContainer>
    )
}
