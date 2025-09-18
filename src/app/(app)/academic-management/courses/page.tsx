
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getStudents } from "@/services/studentService";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SelectGradePage() {
  const [grades, setGrades] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const students = await getStudents();
        const uniqueGrades = [...new Set(students.map(s => s.grade))]
            .filter(g => g && g !== 'N/A' && !isNaN(parseInt(g))) // Filter out invalid grades
            .sort((a,b) => parseInt(a)-parseInt(b));
        setGrades(uniqueGrades);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch available grades.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, [toast]);
  
  const handleGradeSelect = (grade: string) => {
    router.push(`/academic-management/courses/grade/${grade}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Courses by Grade</CardTitle>
          <CardDescription>
            Please select a grade level to view, add, or manage its courses.
          </CardDescription>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : grades.length === 0 ? (
                <div className="py-12 text-center">
                    <h3 className="text-lg font-medium">No grades found.</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        You must have at least one student enrolled to manage courses by grade.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {grades.map(grade => (
                        <Button 
                            key={grade} 
                            variant="outline" 
                            className="p-6 h-auto flex justify-between items-center text-lg btn-glass btn-click-effect"
                            onClick={() => handleGradeSelect(grade)}
                        >
                            <span>Grade {grade}</span>
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
