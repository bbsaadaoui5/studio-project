
"use client";

import { useState } from "react";
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
import { getCoursesByGrade } from "@/services/courseService";
import { enrollStudentInCourses } from "@/services/enrollmentService";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getYear, getMonth, getDate } from "date-fns";

const studentSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  gender: z.enum(["male", "female"]),
  studentType: z.enum(["regular", "support"]),
  grade: z.string(),
  className: z.string(),
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
});

const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 3 - i);
const months = [
  { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
  { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
  { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
  { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' },
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);


export default function NewStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof studentSchema>>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      email: "",
      grade: "",
      className: "",
      parentName: "",
      contact: "",
      altContact: "",
      address: "",
      medicalNotes: "",
      studentType: "regular",
      gender: "male",
    },
  });

  const studentType = form.watch("studentType");

  const onSubmit = async (values: z.infer<typeof studentSchema>) => {
    setIsLoading(true);
    try {
      const newStudentData = {
        ...values,
        grade: values.studentType === 'regular' ? values.grade : 'N/A',
        className: values.studentType === 'regular' ? values.className : 'N/A',
        dateOfBirth: values.dateOfBirth.toISOString(),
      };
      const studentId = await addStudent(newStudentData);
      
      if (values.studentType === 'regular' && values.grade) {
          try {
            const coursesForGrade = await getCoursesByGrade(values.grade);
            if (coursesForGrade.length > 0) {
                const courseIds = coursesForGrade.map(c => c.id);
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
              
              {studentType === 'regular' && (
                <>
                    <FormField
                        control={form.control}
                        name="grade"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Grade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
              <div className="md:col-span-2">
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <Select
                          onValueChange={(val) => {
                            const current = field.value || new Date();
                            const newDate = new Date(current);
                            newDate.setFullYear(parseInt(val));
                            field.onChange(newDate);
                          }}
                          value={field.value ? String(getYear(field.value)) : ''}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger></FormControl>
                          <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <Select
                          onValueChange={(val) => {
                            const current = field.value || new Date();
                            const newDate = new Date(current);
                            newDate.setMonth(parseInt(val));
                            field.onChange(newDate);
                          }}
                           value={field.value ? String(getMonth(field.value)) : ''}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                           <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                     <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <Select
                          onValueChange={(val) => {
                            const current = field.value || new Date();
                            const newDate = new Date(current);
                            newDate.setDate(parseInt(val));
                            field.onChange(newDate);
                          }}
                          value={field.value ? String(getDate(field.value)) : ''}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger></FormControl>
                          <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <FormMessage>{form.formState.errors.dateOfBirth?.message}</FormMessage>
                </FormItem>
              </div>
             
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
                  {isLoading ? "Enrolling..." : "Enroll Student"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
