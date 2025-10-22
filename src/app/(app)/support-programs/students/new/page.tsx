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

const supportStudentSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal("")),
  gender: z.enum(["male", "female"]),
  parentName: z.string().min(3, "Parent/Guardian name is required."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  altContact: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.string().min(10, "A date of birth is required."),
  medicalNotes: z.string().optional(),
  supportCourseId: z.string().min(1, "Please select a support course."),
  teacher: z.string().min(1, "Teacher is required."),
});

export default function NewSupportStudentPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const form = useForm<z.infer<typeof supportStudentSchema>>({
    resolver: zodResolver(supportStudentSchema),
    defaultValues: {
      name: "",
      email: "",
      gender: "male",
      parentName: "",
      contact: "",
      altContact: "",
      address: "",
      medicalNotes: "",
      supportCourseId: "",
      teacher: "",
      dateOfBirth: "",
    },
  });

  useEffect(() => {
    getCoursesByType("support").then((data) => setCourses(data || []));
  }, []);

  // Auto-fill teacher when course changes
  useEffect(() => {
    const courseId = form.watch("supportCourseId");
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      const firstTeacher = course.teachers?.[0]?.name || '';
      form.setValue("teacher", firstTeacher);
      setSelectedTeacher(firstTeacher);
    } else {
      form.setValue("teacher", "");
      setSelectedTeacher("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("supportCourseId"), courses]);

  const onSubmit = async (values: z.infer<typeof supportStudentSchema>) => {
    setIsLoading(true);
    try {
      const newStudentData = {
        ...values,
        // narrow to the literal union expected by NewStudent
        studentType: "support" as const,
        dateOfBirth: values.dateOfBirth,
        // Support students may not have a formal grade/class; provide safe defaults
        grade: values.supportCourseId ? (values.supportCourseId as string) : "",
        className: '',
      } as Parameters<typeof addStudent>[0];
      await addStudent(newStudentData);
      toast({
        title: "Student Enrolled",
        description: `Successfully enrolled ${values.name} in the support program.`,
      });
      router.push("/support-programs/students");
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
          <Link href="/support-programs/students">
            <ArrowLeft />
            <span className="sr-only">{t('common.backToDirectory') || 'Back to directory'}</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add Support Program Student</h1>
      </div>
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2" style={{
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Student Information</h2>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to enroll a new student in a support program.
          </p>
        </div>
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
                      <Input className="glass-input" placeholder="e.g., Youssef El-Amrani" {...field} />
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
                      <Input className="glass-input" placeholder="e.g., youssef.elamrani@example.com" {...field} />
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher</FormLabel>
                    <FormControl>
                      <Input className="glass-input" {...field} readOnly value={selectedTeacher} placeholder="Teacher will be auto-filled" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input
                        className="glass-input"
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
                      <Input className="glass-input" placeholder="e.g., Leila El-Amrani" {...field} />
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
                      <Input className="glass-input" placeholder="e.g., +212 600-000000" {...field} />
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
                      <Input className="glass-input" placeholder="e.g., +212 600-000001" {...field} />
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
                      <Textarea className="glass-input" placeholder="e.g., 456 Park Avenue, Casablanca, Morocco" {...field} />
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
                      <Textarea className="glass-input" placeholder="e.g., Allergic to peanuts" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isLoading} className="btn-gradient btn-click-effect">
                  {isLoading && <Loader2 className="animate-spin" />}
                  {isLoading ? t('common.enrolling') : "Enroll Student"}
                </Button>
              </div>
            </form>
          </Form>
      </div>
    </div>
  );
}
