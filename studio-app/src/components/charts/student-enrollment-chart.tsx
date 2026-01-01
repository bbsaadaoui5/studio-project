
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import * as React from "react";
import { getStudents } from "@/services/studentService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { format, subMonths } from "date-fns";

const chartConfig = {
  students: {
    label: "Students",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function StudentEnrollmentChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    const fetchEnrollmentData = async () => {
      try {
        const students = await getStudents();
        
        const now = new Date();
        const monthlyEnrollments: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
            const month = format(subMonths(now, i), 'MMMM');
            monthlyEnrollments[month] = 0;
        }

        students.forEach(student => {
            const enrollmentMonth = format(new Date(student.enrollmentDate), 'MMMM');
            if (enrollmentMonth in monthlyEnrollments) {
                monthlyEnrollments[enrollmentMonth]++;
            }
        });
        
        const data = Object.keys(monthlyEnrollments).map(month => ({
            month: month,
            students: monthlyEnrollments[month]
        }));

        setChartData(data);
      } catch (error) {
        toast({
            title: "Error",
            description: "Could not fetch enrollment data.",
            variant: "destructive"
        })
      } finally {
        setIsLoading(false);
      }
    }
    fetchEnrollmentData();
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
        <Bar dataKey="students" fill="var(--color-students)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
