
"use client";

import { useEffect, useState } from "react";
import { useRouter, notFound, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getCourse, updateCourse } from "@/services/courseService";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { Course } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { generateCourseDescription } from "@/ai/flows/generate-course-description-flow";

const courseSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters."),
  teacher: z.string().min(3, "Teacher name must be at least 3 characters."),
  department: z.string().min(1, "Please select a department."),
  grade: z.string().min(1, "Please select a grade."),
  credits: z.coerce.number().min(1, "Credits must be at least 1.").max(5, "Credits cannot be more than 5."),
  description: z.string().min(10, "Description must be at least 10 characters."),
});

export default function EditCoursePage() {
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
  });

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        const fetchedCourse = await getCourse(id);
        if (fetchedCourse) {
          setCourse(fetchedCourse);
          form.reset(fetchedCourse);
        } else {
          notFound();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch course data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id, form, toast]);

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    setIsSaving(true);
    try {
      await updateCourse(id, values);
      toast({
        title: "Course Updated",
        description: `Successfully updated ${values.name}.`,
      });
      router.push(`/academic-management/courses/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
  }
  
  if (isLoading || !course) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/academic-management/courses/${id}`}>
            <ArrowLeft />
            <span className="sr-only">Back to Course Details</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Course Information</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editing: {course.name}</CardTitle>
          <CardDescription>
            Update the course's information below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathématiques avancées" {...field} />
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
                    <FormLabel>Teacher Name</FormLabel>
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
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a grade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[...Array(12)].map((_, i) => (
                          <SelectItem key={i + 1} value={`${i + 1}`}>
                            Grade {i + 1}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credits</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="5" placeholder="e.g., 3" {...field} />
                    </FormControl>
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
                <Button type="submit" disabled={isSaving || isGenerating}>
                  {isSaving && <Loader2 className="animate-spin" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
