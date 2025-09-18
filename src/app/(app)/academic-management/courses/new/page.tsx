
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { addCourse } from "@/services/courseService";
import { getStaffMembers } from "@/services/staffService";
import type { Staff } from "@/lib/types";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const courseSchema = z.object({
  name: z.string().min(3, "Course name is required."),
  description: z.string().min(5, "Description is required."),
  credits: z.coerce.number().min(1, "Credits required."),
  department: z.string().min(2, "Department required."),
  grade: z.string().min(1, "Grade required."),
  type: z.enum(["academic", "support"]),
  teachers: z.array(z.string()).min(1, "Select at least one teacher."),
});

export default function NewCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      description: "",
      credits: 1,
      department: "",
      grade: "",
      type: "academic",
      teachers: [],
    },
  });

  useEffect(() => {
    getStaffMembers().then((data) => {
      setStaff(data.filter((s) => s.role === "teacher"));
    });
  }, []);

  const onSubmit = async (values: z.infer<typeof courseSchema>) => {
    setIsLoading(true);
    try {
      const selectedTeachers = staff.filter((t) => values.teachers.includes(t.id)).map(t => ({ id: t.id, name: t.name }));
      await addCourse({
        name: values.name,
        description: values.description,
        credits: values.credits,
        department: values.department,
        grade: values.grade,
        type: values.type,
        teachers: selectedTeachers,
      });
      toast({
        title: "Course Created",
        description: `Course '${values.name}' was created successfully!`,
      });
      router.push("/academic-management/courses");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Course</CardTitle>
          <CardDescription>Fill out the form to create a new course.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Course description..." {...field} />
                    </FormControl>
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
                      <Input type="number" min={1} {...field} />
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
                    <FormControl>
                      <Input placeholder="e.g., Science" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teachers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teachers</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border rounded p-2">
                        {staff.map((teacher) => (
                          <label key={teacher.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="teachers"
                              checked={field.value.includes(teacher.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, teacher.id]);
                                } else {
                                  field.onChange(field.value.filter((id) => id !== teacher.id));
                                }
                              }}
                            />
                            <span>{teacher.name}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Course"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
