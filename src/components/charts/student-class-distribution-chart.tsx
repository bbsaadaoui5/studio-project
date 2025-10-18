

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
                // Map English keys to Arabic labels for grades
                const gradeLabel = (key: string) => {
                  const match = key.match(/Grade (\d+)/);
                  if (match) {
                    return `الصف ${match[1]}`;
                  }
                  return key;
                };
                const data = Object.keys(classDistribution).map((key, index) => ({
                    name: gradeLabel(key),
                    value: classDistribution[key],
                    fill: `hsl(var(--chart-${index + 1}))`
                }));
                setChartData(data);

                const config = {
                    value: {
                        label: "عدد الطلاب",
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
                    title: "خطأ",
                    description: "تعذر جلب بيانات توزيع الطلاب.",
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
            className="mx-auto h-full"
        >
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 w-full">
                <div className="w-full md:w-2/3">
                    <PieChart width={320} height={320}>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent nameKey="name" />}
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
                    </PieChart>
                </div>
                <div className="w-full md:w-1/3 flex justify-center">
                    <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                        verticalAlign="middle"
                        layout="vertical"
                        className="flex-col items-start gap-3"
                    />
                </div>
            </div>
        </ChartContainer>
    )
}
