

"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { getStudentStats } from "@/services/studentService"
import { type Student } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function StudentClassDistributionChart() {
    const [chartData, setChartData] = React.useState<any[]>([]);
    const [chartConfig, setChartConfig] = React.useState<ChartConfig>({});
    const [isLoading, setIsLoading] = React.useState(true);
    const { toast } = useToast();

    React.useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const { classDistribution } = await getStudentStats();
                
                const data = Object.keys(classDistribution).map((key, index) => ({
                    name: key,
                    value: classDistribution[key],
                    fill: `hsl(var(--chart-${index + 1}))`
                }));
                setChartData(data);

                const config = {
                    value: {
                        label: "Students",
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
                    description: "Could not fetch student data for charts.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchStudentData();
    }, [toast]);
    
    if (isLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="animate-spin" /></div>
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
            {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
            </Pie>
            <ChartLegend
            content={<ChartLegendContent nameKey="name" />}
            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
            />
        </PieChart>
        </ChartContainer>
    )
}
