
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
  description: z.string().min(10, "Description must be at least 10 characters."),
});



export default function EditSupportCoursePage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      teacher: '',
      department: '',
      description: '',
    },
  });

  useEffect(() => {
    if (!id) {
      setErrorMsg('Invalid or missing course ID.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    getCourse(id)
      .then((fetchedCourse) => {
        if (fetchedCourse && fetchedCourse.type === 'support') {
          const safeCourse = {
            name: '',
            teacher: '',
            department: '',
            description: '',
            ...fetchedCourse,
          };
          form.reset(safeCourse);
        } else {
          setErrorMsg('Support course not found.');
        }
      })
      .catch(() => {
        setErrorMsg('Failed to fetch course data.');
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const onSubmit = async (values: z.infer<typeof courseSchema>) => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateCourse(id, values);
      toast({
        title: 'Course Updated',
        description: `Successfully updated ${values.name}.`,
      });
      router.push(`/support-programs/courses/${id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update the course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleGenerateDescription = async () => {
    const courseName = form.getValues('name');
    if (!courseName) {
      toast({ title: 'Please enter a course name first.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      // Replace with actual AI call if available
      const result = { description: `This is a generated description for ${courseName}.` };
      form.setValue('description', result.description, { shouldValidate: true });
    } catch (error) {
      toast({ title: 'Error generating description', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };
  


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-destructive">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{errorMsg}</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/support-programs/courses/${id}`}>
            <ArrowLeft />
            <span className="sr-only">Back to Course Details</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Support Course</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editing: {form.watch('name') || 'Course'}</CardTitle>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
