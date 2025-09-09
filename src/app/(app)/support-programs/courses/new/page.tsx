
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addCourse } from "@/services/courseService";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateCourseDescription } from "@/ai/flows/generate-course-description-flow";

const courseSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters."),
  teacher: z.string().min(3, "Teacher name must be at least 3 characters."),
  department: z.string().min(1, "Please select a department."),
  description: z.string().min(10, "Description must be at least 10 characters."),
});

export default function NewSupportCoursePage() {
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      teacher: "",
      department: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    setIsLoading(true);
    try {
      await addCourse({
        ...values,
        type: "support",
        grade: "N/A", // Not applicable for support courses
        credits: 0, // Not applicable for support courses
      });
      toast({
        title: "Support Course Created",
        description: `The course "${values.name}" has been successfully created.`,
      });
      router.push(`/support-programs/courses`);
    } catch (error) {
       toast({
        title: "Error",
        description: "Failed to create the course. Please try again.",
        variant: "destructive",
      });
    } finally {
       setIsLoading(false);
    }
  }

  const handleGenerateDescription = async () => {
    const courseName = form.getValues("name");
    if (!courseName) {
      toast({ title: "Please enter a course name first.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateCourseDescription({ name: courseName, keywords: form.getValues("department") });
      form.setValue("description", result.description, { shouldValidate: true });
    } catch (error) {
      toast({ title: "Error generating description", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
            <Link href="/support-programs/courses">
                <ArrowLeft />
                <span className="sr-only">Back to Courses</span>
            </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add New Support Course</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
          <CardDescription>Fill out the form below to add a new support/extracurricular course.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Robotics Club" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teacher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fatima Al-Fihri" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Department / Category</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tutoring">Tutoring</SelectItem>
                        <SelectItem value="STEM">STEM</SelectItem>
                        <SelectItem value="Arts & Music">Arts & Music</SelectItem>
                        <SelectItem value="Sports">Sports</SelectItem>
                        <SelectItem value="Languages">Languages</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <div className="flex justify-between items-center">
                        <FormLabel>Description</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateDescription}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                            {isGenerating ? "Generating..." : "Generate with AI"}
                        </Button>
                    </div>
                    <FormControl>
                      <Textarea rows={5} placeholder="Provide a brief summary of the course..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isLoading || isGenerating}>
                    {isLoading && <Loader2 className="animate-spin" />}
                    {isLoading ? "Creating..." : "Create Course"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
