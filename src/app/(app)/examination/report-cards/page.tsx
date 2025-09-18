
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getStudents } from "@/services/studentService";
import { generateReportCard } from "@/services/reportCardService";
import { Student, ReportCard, ReportCardCourse } from "@/lib/types";
import { Loader2, FileText, Wand2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type GeneratingState = "idle" | "fetching" | "compiling" | "writing" | "done";

export default function ReportCardsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [reportingPeriod, setReportingPeriod] = useState<string>("");
  const [generatedReport, setGeneratedReport] = useState<ReportCard | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [generatingState, setGeneratingState] = useState<GeneratingState>("idle");

  const generatingMessages: Record<GeneratingState, string> = {
    idle: "Generate with AI",
    fetching: "Fetching data...",
    compiling: "Compiling grades...",
    writing: "Writing comments...",
    done: "Done!",
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const fetchedStudents = await getStudents();
        setStudents(fetchedStudents.filter(s => s.status === 'active'));
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch students.", variant: "destructive" });
      } finally {
        setIsLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [toast]);
  
  const handleGenerateReport = async () => {
    if (!selectedStudent || !reportingPeriod) {
        toast({ title: "Missing Information", description: "Please select a student and enter a reporting period.", variant: "destructive"});
        return;
    }
    setGeneratedReport(null);
    try {
        // This is a simplified simulation of multi-stage progress
        setGeneratingState("fetching");
        await new Promise(res => setTimeout(res, 500));
        setGeneratingState("compiling");
        const report = { report: "Mock report card" };
        setGeneratingState("writing");
        await new Promise(res => setTimeout(res, 1500)); // Simulate AI writing time
        setGeneratedReport(report);
        setGeneratingState("done");
    } catch (error) {
        console.error(error);
        toast({ title: "Error Generating Report", description: "An unexpected error occurred. Please check the data and try again.", variant: "destructive"});
        setGeneratingState("idle");
    } finally {
        setTimeout(() => setGeneratingState("idle"), 2000);
    }
  }
  
  const isGenerating = generatingState !== 'idle' && generatingState !== 'done';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Generate Report Card</CardTitle>
            <CardDescription>
              Select a student and reporting period to generate their report card with AI-powered comments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="student-select">Student</Label>
                <Select onValueChange={setSelectedStudent} value={selectedStudent} disabled={isLoadingStudents}>
                    <SelectTrigger id="student-select">
                        <SelectValue placeholder="Select a student..." />
                    </SelectTrigger>
                    <SelectContent>
                        {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="reporting-period">Reporting Period</Label>
                <Input 
                    id="reporting-period" 
                    placeholder="e.g., Semestre d'automne 2024"
                    value={reportingPeriod}
                    onChange={e => setReportingPeriod(e.target.value)}
                />
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleGenerateReport} disabled={isGenerating || !selectedStudent || !reportingPeriod}>
                {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                {generatingMessages[generatingState]}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="lg:col-span-2">
         <Card className="min-h-[600px]">
             {isGenerating && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">{generatingMessages[generatingState]}</p>
                </div>
            )}
             {!isGenerating && !generatedReport && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                    <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">Your generated report card will appear here.</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Select a student and a reporting period to begin.
                    </p>
                </div>
            )}
            {generatedReport && (
                <>
                <CardHeader className="bg-muted/30">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">Report Card</CardTitle>
                            <CardDescription>Official academic performance record.</CardDescription>
                        </div>
                        <div className="text-right">
                             <p className="font-bold">{generatedReport.studentName}</p>
                             <p className="text-sm text-muted-foreground">{generatedReport.class}</p>
                             <p className="text-sm text-muted-foreground">{generatedReport.reportingPeriod}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2">Overall Summary</h3>
                            <p className="text-muted-foreground pt-3 text-sm italic">
                                {generatedReport.overallSummary}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold border-b pb-2">Course Performance</h3>
                            <div className="space-y-4 pt-3">
                                {generatedReport.courses.map((course, index) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold">{course.courseName}</h4>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{course.finalGrade}</p>
                                                <p className="text-xs text-muted-foreground">Final Grade</p>
                                            </div>
                                        </div>
                                         <p className="text-xs text-muted-foreground">Teacher: {course.teacherName}</p>
                                         <Separator className="my-2" />
                                        <p className="text-sm text-muted-foreground mt-2">{course.comments}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
                </>
            )}
         </Card>
      </div>
    </div>
  );
}
