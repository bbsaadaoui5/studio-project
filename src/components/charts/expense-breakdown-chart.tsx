
"use client"

import * as React from "react"
import { Pie, PieChart } from "recharts"

import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { getExpenseSummaryWithSalaries } from "@/services/financeService"

// تعريب الفئات
const categoryLabels: Record<string, string> = {
    salaries: "الرواتب",
    utilities: "الخدمات (كهرباء، ماء، إنترنت)",
    supplies: "الخدمات (نظافة، أمن، نقل)",
    maintenance: "الصيانة",
    other: "أخرى",
    "Staff Salaries": "رواتب الموظفين"
};

export function ExpenseBreakdownChart() {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchExpenseData = async () => {
            try {
                const expenseSummary = await getExpenseSummaryWithSalaries();
                const data = Object.keys(expenseSummary).map((key, index) => ({
                    name: categoryLabels[key] || key,
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
        <div className="flex flex-row items-center justify-center gap-8 w-full max-w-2xl mx-auto">
            <div className="flex justify-center items-center w-64 h-64">
                <ChartContainer
                    config={chartConfig}
                    className="w-64 h-64"
                >
                    <PieChart width={240} height={240}>
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
                            cx={120}
                            cy={120}
                        />
                    </PieChart>
                </ChartContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-col gap-1 min-w-[120px] pr-1">
                {chartData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1">
                        <span
                            className="inline-block rounded-sm"
                            style={{
                                width: 14,
                                height: 6,
                                background: entry.fill,
                                display: 'inline-block',
                                marginInlineEnd: 4
                            }}
                        />
                        <span className="font-medium text-xs text-right whitespace-nowrap">{entry.name}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
