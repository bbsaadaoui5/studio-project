"use client";

import { useEffect, useState } from "react";
import { useRouter, notFound, useParams } from "next/navigation";
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
import { getStudent, updateStudent } from "@/services/studentService";
import { getCoursesByType } from "@/services/courseService";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Student } from "@/lib/types";
import { getYear, getMonth, getDate } from "date-fns";

const studentSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  status: z.enum(["active", "inactive"]),
  gender: z.enum(["male", "female"]),
  studentType: z.enum(["regular", "support"]),
  grade: z.string(),
  className: z.string(),
  supportCourseId: z.string().optional(),
  teacher: z.string().optional(),
  teacherId: z.string().optional(),
  parentName: z.string().min(3, "Parent/Guardian name is required."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  altContact: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }),
  medicalNotes: z.string().optional(),
}).refine(data => data.studentType === 'support' || (data.grade && data.className), {
    message: "Grade and Class are required for regular students.",
    path: ["grade"],
}).refine(data => data.studentType === 'regular' || (!!data.supportCourseId && !!data.teacher), {
    message: "Support course and teacher are required for support students.",
    path: ["supportCourseId"],
});

const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 3 - i);
const months = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' },
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function EditStudentPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);

  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
  });

  const studentType = form.watch("studentType");
  const supportCourseId = form.watch("supportCourseId");

  useEffect(() => {
    if (!id) return;
    const fetchStudent = async () => {
      setIsLoading(true);
      try {
        const fetchedStudent = await getStudent(id);
        if (fetchedStudent) {
          setStudent(fetchedStudent);
          form.reset({
            ...fetchedStudent,
            dateOfBirth: fetchedStudent.dateOfBirth ? new Date(fetchedStudent.dateOfBirth) : new Date(),
            medicalNotes: fetchedStudent.medicalNotes || '',
            altContact: fetchedStudent.altContact || '',
            email: fetchedStudent.email || '',
            supportCourseId: (fetchedStudent as any).supportCourseId || '',
            teacher: (fetchedStudent as any).teacher || '',
            teacherId: (fetchedStudent as any).teacherId || '',
          });
        } else {
          notFound();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch student data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudent();
  }, [id, form, toast]);

  // Load support courses for dropdown
  useEffect(() => {
    getCoursesByType("support").then((data) => setCourses(data || []));
  }, []);

  // Auto-populate teacher when support course changes
  useEffect(() => {
    if (studentType !== 'support' || !supportCourseId) {
      form.setValue('teacher', '');
      form.setValue('teacherId', '');
      return;
    }
    const course = courses.find((c) => c.id === supportCourseId);
    if (course) {
      const firstTeacher = (course as any).teachers?.[0];
      if (firstTeacher) {
        form.setValue('teacher', firstTeacher.name);
        form.setValue('teacherId', firstTeacher.id || '');
      } else {
        const teacherName = (course as any).teacher || '';
        form.setValue('teacher', teacherName);
        form.setValue('teacherId', '');
      }
    } else {
      form.setValue('teacher', '');
      form.setValue('teacherId', '');
    }
  }, [studentType, supportCourseId, courses, form]);

  // Default teacher to first option when options exist but no teacher selected
  useEffect(() => {
    if (studentType !== 'support' || !supportCourseId) return;
    const course: any = courses.find((c) => c.id === supportCourseId);
    if (!course) return;
    const firstTeacher = course?.teachers?.[0];
    if (firstTeacher && !form.getValues('teacher')) {
      form.setValue('teacher', firstTeacher.name);
      form.setValue('teacherId', firstTeacher.id || '');
    } else if (course?.teacher && !form.getValues('teacher')) {
      form.setValue('teacher', course.teacher);
      form.setValue('teacherId', '');
    }
  }, [studentType, supportCourseId, courses, form]);

  async function onSubmit(values: z.infer<typeof studentSchema>) {
    setIsSaving(true);
    try {
      const dataToUpdate = {
        ...values,
        grade: values.studentType === 'regular' ? values.grade : 'N/A',
        className: values.studentType === 'regular' ? values.className : 'N/A',
        supportCourseId: values.studentType === 'support' ? (values.supportCourseId || '') : '',
        teacher: values.studentType === 'support' ? (values.teacher || '') : '',
        teacherId: values.studentType === 'support' ? (values.teacherId || '') : '',
        dateOfBirth: values.dateOfBirth.toISOString(),
        medicalNotes: values.medicalNotes || '',
        altContact: values.altContact || '',
        email: values.email || '',
      };
      await updateStudent(id, dataToUpdate);
      toast({
        title: "Student Updated",
        description: `Successfully updated ${values.name}'s record.`,
      });
      router.push(`/student-management/directory/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the student. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  if (isLoading || !student) {
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
          <Link href={`/student-management/directory/${id}`}>
            <ArrowLeft />
            <span className="sr-only">Back to Profile</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Student Information</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editing: {student.name}</CardTitle>
          <CardDescription>
            Update the student's information below.
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
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Date of Birth</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                      <Select onValueChange={(val) => { 
                        const d = new Date(field.value || Date.now()); 
                        d.setFullYear(parseInt(val)); 
                        field.onChange(d); 
                      }} value={field.value ? String(getYear(field.value)) : ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select onValueChange={(val) => { 
                        const d = new Date(field.value || Date.now()); 
                        d.setMonth(parseInt(val)); 
                        field.onChange(d); 
                      }} value={field.value ? String(getMonth(field.value)) : ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select onValueChange={(val) => { 
                        const d = new Date(field.value || Date.now()); 
                        d.setDate(parseInt(val)); 
                        field.onChange(d); 
                      }} value={field.value ? String(getDate(field.value)) : ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
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
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
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
                name="status" 
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
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
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular (Grade-based)</SelectItem>
                        <SelectItem value="support">Support Program</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {studentType === 'regular' && (
                <>
                  <FormField 
                    control={form.control} 
                    name="grade" 
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
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
              {studentType === 'support' && (
                <>
                  <FormField
                    control={form.control}
                    name="supportCourseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Support Course</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
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
                <Button type="submit" disabled={isSaving}>
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