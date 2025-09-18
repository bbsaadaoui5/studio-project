"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { getCoursesByType, getCoursesByGrade } from "@/services/courseService";
import type { Course } from "@/lib/types";
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
import { enrollStudentInCourses } from "@/services/enrollmentService";
import { ArrowLeft, Loader2 } from "lucide-react";

const studentSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal("")),
  gender: z.enum(["male", "female"]),
  studentType: z.enum(["regular", "support"]),
  grade: z.string().optional(),
  className: z.string().optional(),
  parentName: z.string().min(3, "Parent/Guardian name is required."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  altContact: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.date({ required_error: "A date of birth is required." }),
  medicalNotes: z.string().optional(),
  supportCourseId: z.string().optional(),
  teacher: z.string().optional(),
  teacherId: z.string().optional(),
});

export default function NewStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      gender: "male",
      studentType: "regular",
      grade: "",
      className: "",
      parentName: "",
      contact: "",
      altContact: "",
      address: "",
      dateOfBirth: undefined,
      medicalNotes: "",
      supportCourseId: "",
      teacher: "",
      teacherId: "",
    },
  });

  const studentType = form.watch("studentType");
  const supportCourseId = form.watch("supportCourseId");

  useEffect(() => {
    getCoursesByType("support").then((data) => setCourses(data || []));
  }, []);

  // Auto-populate teacher when support course selection changes
  useEffect(() => {
    if (studentType !== "support" || !supportCourseId) {
      form.setValue("teacher", "");
      form.setValue("teacherId", "");
      return;
    }
    
    const course = courses.find((c) => c.id === supportCourseId);
    if (course) {
      const firstTeacher = (course as any).teachers?.[0];
      if (firstTeacher) {
        form.setValue("teacher", firstTeacher.name);
        form.setValue("teacherId", firstTeacher.id || "");
      } else {
        const teacherName = (course as any).teacher || "";
        form.setValue("teacher", teacherName);
        form.setValue("teacherId", "");
      }
    } else {
      form.setValue("teacher", "");
      form.setValue("teacherId", "");
    }
  }, [supportCourseId, studentType, courses, form]);
  
  // Default teacher to first option when options exist but no teacher selected
  useEffect(() => {
    if (studentType !== "support" || !supportCourseId) return;
    const course: any = courses.find((c) => c.id === supportCourseId);
    if (!course) return;
    const firstTeacher = course?.teachers?.[0];
    if (firstTeacher && !form.getValues("teacher")) {
      form.setValue("teacher", firstTeacher.name);
      form.setValue("teacherId", firstTeacher.id || "");
    } else if (course?.teacher && !form.getValues("teacher")) {
      form.setValue("teacher", course.teacher);
      form.setValue("teacherId", "");
    }
  }, [studentType, supportCourseId, courses, form]);

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    setIsLoading(true);
    try {
      let newStudentData = {
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
        grade: values.grade ?? "",
        className: values.className ?? "",
        supportCourseId: values.supportCourseId ?? "",
        teacher: values.teacher ?? "",
        teacherId: values.teacherId ?? "",
      };
      if (values.studentType === "regular") {
        newStudentData = {
          ...newStudentData,
          supportCourseId: "",
          teacher: "",
          teacherId: "",
        };
      } else if (values.studentType === "support") {
        newStudentData = {
          ...newStudentData,
          grade: "",
          className: "",
        };
      }
      const studentId = await addStudent(newStudentData);
      if (values.studentType === "regular" && values.grade) {
        try {
          const coursesForGrade = await getCoursesByGrade(values.grade);
          if (coursesForGrade.length > 0) {
            const courseIds = coursesForGrade.map((c) => c.id);
            await enrollStudentInCourses(studentId, courseIds);
            toast({
              title: "Student Enrolled & Courses Assigned",
              description: `Successfully enrolled ${values.name} and assigned them to ${courseIds.length} course(s).`,
            });
          } else {
            toast({
              title: "Student Enrolled",
              description: `Successfully enrolled ${values.name}. No courses found for Grade ${values.grade} to auto-enroll.`,
            });
          }
        } catch (enrollmentError) {
          toast({
            title: "Student Enrolled, but Courses Failed",
            description: `Successfully enrolled ${values.name}, but failed to automatically assign courses. Please do it manually.`,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Student Enrolled",
          description: `Successfully enrolled ${values.name} in the support program.`,
        });
      }
      router.push("/student-management/directory");
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
          <Link href="/student-management/directory">
            <ArrowLeft />
            <span className="sr-only">Back to Directory</span>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                name="studentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular (Grade-based)</SelectItem>
                        <SelectItem value="support">Support Program</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Regular student fields */}
              {studentType === "regular" && (
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
              {/* Support student fields */}
              {studentType === "support" && (
                <>
                  <FormField
                    control={form.control}
                    name="supportCourseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Course</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name}
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
                    name="teacher"
                    render={({ field }) => {
                      const selectedCourse = courses.find((c) => c.id === supportCourseId) as any;
                      const teacherOptions: { id?: string; name: string }[] = selectedCourse?.teachers?.length
                        ? selectedCourse.teachers
                        : (selectedCourse?.teacher ? [{ name: selectedCourse.teacher }] : []);
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
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 123 Main St, Casablanca" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="medicalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Allergies, medications, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value ? field.value.toISOString().substring(0, 10) : ""}
                        onChange={e => field.onChange(new Date(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enroll Student
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}