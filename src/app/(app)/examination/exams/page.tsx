
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  GlassModal,
  GlassModalContent,
  GlassModalDescription,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalTrigger,
} from "@/components/ui/glass-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addExam, getExams } from "@/services/examService";
import type { Exam, Course } from "@/lib/types";
import { Loader2, PlusCircle, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCourses } from "@/services/courseService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const examSchema = z.object({
    courseId: z.string().min(1, "Please select a course."),
    title: z.string().min(3, "Exam title is required."),
    examDate: z.date({ required_error: "An exam date is required."}),
    duration: z.coerce.number().positive("Duration must be a positive number."),
});

export default function ExamsPage() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: {
        title: "",
        courseId: "",
        duration: 60,
    }
  });

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const [fetchedExams, fetchedCourses] = await Promise.all([
        getExams(),
        getCourses()
      ]);
      setExams(fetchedExams);
      setCourses(fetchedCourses);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch exam data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [toast]);

  async function onSubmit(values: z.infer<typeof examSchema>) {
    setIsSubmitting(true);
    try {
        const selectedCourse = courses.find(c => c.id === values.courseId);
        if (!selectedCourse) {
            toast({ title: "Error", description: "Invalid course selected.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

      await addExam({
        ...values,
        examDate: values.examDate.toISOString(),
        courseName: selectedCourse.name
      });
      toast({
        title: "Exam Scheduled",
        description: `The exam "${values.title}" has been scheduled.`,
      });
      fetchPageData();
      form.reset({ title: "", courseId: "", duration: 60 });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule exam.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Exam Schedule</CardTitle>
            <CardDescription>
              Schedule and manage all upcoming exams.
            </CardDescription>
          </div>
          <GlassModal open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <GlassModalTrigger asChild>
              <Button className="btn-glass-primary btn-click-effect">
                <PlusCircle />
                Schedule New Exam
              </Button>
            </GlassModalTrigger>
            <GlassModalContent className="sm:max-w-[425px]">
              <GlassModalHeader>
                <GlassModalTitle>Schedule a New Exam</GlassModalTitle>
                <GlassModalDescription>
                  Enter the details for the new exam.
                </GlassModalDescription>
              </GlassModalHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                   <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title</FormLabel>
                        <FormControl><Input className="glass-input" placeholder="e.g., Midterm Exam" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Exam Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (in minutes)</FormLabel>
                        <FormControl><Input className="glass-input" type="number" placeholder="e.g., 60" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting} className="btn-gradient btn-click-effect">
                      {isSubmitting && <Loader2 className="animate-spin" />}
                      {isSubmitting ? "Scheduling..." : "Schedule Exam"}
                    </Button>
                  </div>
                </form>
              </Form>
            </GlassModalContent>
          </GlassModal>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exam Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exams.length > 0 ? (
                  exams.map((exam) => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{format(new Date(exam.examDate), "PPP")}</TableCell>
                      <TableCell>{exam.title}</TableCell>
                      <TableCell>{exam.courseName}</TableCell>
                      <TableCell className="text-right">{exam.duration} mins</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No exams scheduled yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
