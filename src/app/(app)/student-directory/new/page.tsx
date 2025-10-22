"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { addStudent } from "@/services/studentService";
import { getCoursesByType } from "@/services/courseService";
import { Course } from '@/lib/types';
import { ArrowLeft, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/translation-provider";

const unifiedStudentSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal("")),
  gender: z.enum(["male", "female"]),
  programType: z.enum(["regular", "support"]),
  grade: z.string().optional(),
  className: z.string().optional(),
  supportCourseId: z.string().optional(),
  teacher: z.string().optional(),
  teacherId: z.string().optional(),
  parentName: z.string().min(3, "Parent/Guardian name is required."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  altContact: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.string().min(10, "A date of birth is required."),
  medicalNotes: z.string().optional(),
}).refine(data => data.programType === 'support' ? data.supportCourseId && data.teacher : data.grade && data.className, {
  message: "All required fields must be filled.",
});

export default function NewUnifiedStudentPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const form = useForm<z.infer<typeof unifiedStudentSchema>>({
    resolver: zodResolver(unifiedStudentSchema),
  defaultValues: {
      name: "",
      email: "",
      gender: "male",
      programType: "regular",
      grade: "",
      className: "",
      supportCourseId: "",
      teacher: "",
      teacherId: "",
      parentName: "",
      contact: "",
      altContact: "",
      address: "",
      medicalNotes: "",
      dateOfBirth: "",
    },
  });

  const programType = form.watch("programType");
  const supportCourseId = form.watch("supportCourseId");

  useEffect(() => {
    getCoursesByType("support").then((data) => setCourses(data || []));
  }, []);

  // Auto-populate teacher when support course selection changes
  useEffect(() => {
    if (programType !== "support" || !supportCourseId) {
      form.setValue("teacher", "");
      form.setValue("teacherId", "");
      return;
    }

    const course: Course | undefined = courses.find((c) => c.id === supportCourseId);
    if (course) {
      const firstTeacher = course.teachers?.[0];
      if (firstTeacher) {
        form.setValue("teacher", firstTeacher.name);
        form.setValue("teacherId", firstTeacher.id || "");
      } else {
        // No teachers array available, ensure we set empty defaults
        form.setValue("teacher", "");
        form.setValue("teacherId", "");
      }
    } else {
      form.setValue("teacher", "");
      form.setValue("teacherId", "");
    }
  }, [supportCourseId, programType, courses, form]);

  // Default teacher to first option when options exist but no teacher selected
  useEffect(() => {
    if (programType !== "support" || !supportCourseId) return;
    const course: Course | undefined = courses.find((c) => c.id === supportCourseId);
    if (!course) return;
    const firstTeacher = course?.teachers?.[0]?.name || '';
    if (firstTeacher && !form.getValues("teacher")) {
      form.setValue("teacher", firstTeacher);
      form.setValue("teacherId", course.teachers?.[0]?.id || "");
    }
  }, [programType, supportCourseId, courses, form]);

  const onSubmit = async (values: z.infer<typeof unifiedStudentSchema>) => {
    setIsLoading(true);
    try {
      const newStudentData = {
        ...values,
        studentType: values.programType,
        dateOfBirth: values.dateOfBirth,
        teacherId: values.teacherId || "",
        grade: values.grade || "",
        className: values.className || "",
      };
      await addStudent(newStudentData);
      toast({
        title: "Student Enrolled",
        description: `Successfully enrolled ${values.name} in the ${values.programType === 'support' ? 'support program' : 'regular program'}.`,
      });
      router.push("/student-directory");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll the student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/student-directory">
            <ArrowLeft />
            <span className="sr-only">{t('common.backToDirectory') || 'Back to directory'}</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add New Student</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>
            Fill out the form below to enroll a new student.
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
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Youssef El-Amrani" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., youssef.elamrani@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="programType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="support">Support Program</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Regular student fields */}
              {form.watch("programType") === "regular" && (
                <>
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
                    name="className"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., A" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {/* Support program fields */}
              {form.watch("programType") === "support" && (
                <>
                  <FormField
                    control={form.control}
                    name="supportCourseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Course</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select a course" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="teacher"
                    render={({ field }) => {
                      const selectedCourse: Course | undefined = courses.find((c) => c.id === supportCourseId);
                      const teacherOptions: { id?: string; name: string }[] = selectedCourse?.teachers?.length
                        ? selectedCourse.teachers
                        : [];
                      const hasTeachers = teacherOptions.length > 0;
                      return (
                        <FormItem>
                          <FormLabel>Teacher</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const selectedTeacher = teacherOptions.find(t => t.name === value);
                              field.onChange(value);
                              form.setValue("teacherId", selectedTeacher?.id || "");
                            }} 
                            value={field.value || ""} 
                            disabled={!hasTeachers}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={hasTeachers ? "Select a teacher" : "No teachers available"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teacherOptions.map((t, idx) => (
                                <SelectItem key={t.id || t.name || idx} value={t.name}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )
                    }}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().slice(0,10) : ''}
                        onChange={(e) => {
                          const iso = e.target.value ? new Date(e.target.value).toISOString() : '';
                          field.onChange(iso);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent/Guardian Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Leila El-Amrani" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent/Guardian Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +212 600-000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="altContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternative Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +212 600-000001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 456 Park Avenue, Casablanca, Morocco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medicalNotes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Medical Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Allergic to peanuts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="animate-spin" />}
                  {isLoading ? t('common.enrolling') : "Enroll Student"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
