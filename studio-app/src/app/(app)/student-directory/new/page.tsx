"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Loader2, X, CheckCircle2, Users, BookOpen } from "lucide-react";
import { useTranslation } from "@/i18n/translation-provider";

const unifiedStudentSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal("")),
  gender: z.enum(["male", "female"]),
  programType: z.enum(["regular", "support"]),
  grade: z.string().optional(),
  className: z.string().optional(),
  supportCourseIds: z.array(z.string()).optional(),
  teacher: z.string().optional(),
  teacherId: z.string().optional(),
  parentName: z.string().min(3, "Parent/Guardian name is required."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  altContact: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.string().min(10, "A date of birth is required."),
  medicalNotes: z.string().optional(),
}).refine(data => data.programType === 'support' ? (data.supportCourseIds && data.supportCourseIds.length > 0 && data.teacher) : data.grade && data.className, {
  message: "All required fields must be filled.",
});

export default function NewUnifiedStudentPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programFilter, setProgramFilter] = useState<'all' | 'academic' | 'skills'>('all');

  const form = useForm<z.infer<typeof unifiedStudentSchema>>({
    resolver: zodResolver(unifiedStudentSchema),
    defaultValues: {
      name: "",
      email: "",
      gender: "male",
      programType: "regular",
      grade: "",
      className: "",
      supportCourseIds: [],
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
  const supportCourseIds = useMemo(
    () => form.watch("supportCourseIds") || [],
    [form]
  );

  useEffect(() => {
    getCoursesByType("support").then((data) => setCourses(data || []));
  }, []);

  useEffect(() => {
    if (programType !== "support" || supportCourseIds.length === 0) {
      form.setValue("teacher", "");
      form.setValue("teacherId", "");
      return;
    }

    const firstCourseId = supportCourseIds[0];
    const course: Course | undefined = courses.find((c) => c.id === firstCourseId);
    if (course) {
      const firstTeacher = course.teachers?.[0];
      if (firstTeacher) {
        form.setValue("teacher", firstTeacher.name);
        form.setValue("teacherId", firstTeacher.id || "");
      } else {
        form.setValue("teacher", "");
        form.setValue("teacherId", "");
      }
    }
  }, [supportCourseIds, programType, courses, form]);

  const toggleCourse = (courseId: string) => {
    const current = supportCourseIds || [];
    if (current.includes(courseId)) {
      form.setValue("supportCourseIds", current.filter(id => id !== courseId));
    } else {
      form.setValue("supportCourseIds", [...current, courseId]);
    }
  };

  const filteredCourses = courses;
  const selectedCourses = courses.filter(c => supportCourseIds.includes(c.id));

  const onSubmit = async (values: z.infer<typeof unifiedStudentSchema>) => {
    setIsLoading(true);
    try {
      const teachers = (values.supportCourseIds ?? []).map((courseId) => {
        const course = courses.find((c) => c.id === courseId);
        const firstTeacher = course?.teachers?.[0];
        return {
          courseId,
          teacherId: firstTeacher?.id || "",
          teacherName: firstTeacher?.name || "",
        };
      });

      const newStudentData = {
        ...values,
        studentType: values.programType,
        dateOfBirth: values.dateOfBirth,
        supportCourseIds: values.supportCourseIds ?? [],
        teachers,
        teacher: teachers[0]?.teacherName || values.teacher || "",
        teacherId: teachers[0]?.teacherId || values.teacherId || "",
        grade: values.grade || "",
        className: values.className || "",
      };
      await addStudent(newStudentData);
      toast({
        title: "Student Enrolled",
        description: `Successfully enrolled ${values.name}`,
      });
      router.push("/student-directory");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enroll the student.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/student-directory">
            <ArrowLeft className="rotate-180" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">إضافة طالب جديد</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Student Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                <h3 className="text-lg font-bold text-slate-900 pb-3 border-b-2 border-blue-500">معلومات الطالب</h3>

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">اسم الطالب الكامل</FormLabel>
                    <FormControl><Input placeholder="مثال: أحمد محمد علي" className="text-right" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="gender" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">الجنس</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="text-right"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">تاريخ الميلاد</FormLabel>
                    <FormControl>
                      <Input type="date" value={field.value ? new Date(field.value).toISOString().slice(0, 10) : ''} onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : '')} className="text-right" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="programType" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">نوع البرنامج</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger className="text-right"><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="regular">برنامج عادي</SelectItem>
                        <SelectItem value="support">برنامج دعم</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {programType === "regular" && (
                  <>
                    <FormField control={form.control} name="grade" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">الصف</FormLabel>
                        <FormControl><Input placeholder="مثال: 7" className="text-right" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="className" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold">الشعبة</FormLabel>
                        <FormControl><Input placeholder="مثال: أ" className="text-right" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </>
                )}

                <FormField control={form.control} name="parentName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">اسم ولي الأمر</FormLabel>
                    <FormControl><Input placeholder="مثال: محمد أحمد" className="text-right" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="contact" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">رقم التواصل</FormLabel>
                    <FormControl><Input placeholder="+212 600-000000" className="text-right" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-700 font-semibold">العنوان</FormLabel>
                    <FormControl><Textarea placeholder="العنوان الكامل" className="text-right" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                {programType === "support" && (
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{supportCourseIds.length}</div>
                      <div className="text-xs text-slate-600">برنامج مختار</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{courses.length}</div>
                      <div className="text-xs text-slate-600">برنامج متاح</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Programs */}
            <div className="lg:col-span-2">
              {programType === "support" && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-blue-500">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-500" />
                      اختيار برامج الدعم للطالب
                    </h3>
                    <div className="flex gap-2 bg-slate-100 rounded-lg p-1">
                      <button type="button" onClick={() => setProgramFilter('all')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${programFilter === 'all' ? 'bg-blue-500 text-white' : 'text-slate-600'}`}>الكل</button>
                      <button type="button" onClick={() => setProgramFilter('academic')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${programFilter === 'academic' ? 'bg-blue-500 text-white' : 'text-slate-600'}`}>أكاديمي</button>
                      <button type="button" onClick={() => setProgramFilter('skills')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${programFilter === 'skills' ? 'bg-blue-500 text-white' : 'text-slate-600'}`}>مهارات</button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {filteredCourses.map((course) => {
                      const isSelected = supportCourseIds.includes(course.id);
                      return (
                        <div key={course.id} onClick={() => toggleCourse(course.id)} className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleCourse(course.id)} onClick={(e) => e.stopPropagation()} className="absolute top-4 left-4 w-5 h-5" />
                          <div className="mr-8">
                            <h4 className="font-bold text-slate-900 mb-2">{course.name}</h4>
                            {course.description && <p className="text-xs text-slate-600 mb-3">{course.description}</p>}
                            {course.teachers?.[0] && (
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Users className="w-4 h-4 text-blue-500" />
                                <span>{course.teachers[0].name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-3 font-semibold text-slate-900">
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      البرامج المختارة
                    </div>
                    {selectedCourses.length === 0 ? (
                      <p className="text-slate-500 italic text-sm">لم يتم اختيار أي برامج</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedCourses.map((course) => (
                          <div key={course.id} className="flex items-center gap-2 bg-white border border-blue-500 rounded-full px-4 py-2 text-sm">
                            <span>{course.name}</span>
                            <button type="button" onClick={() => toggleCourse(course.id)} className="text-red-500 hover:text-red-700">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.push("/student-directory")} className="flex-1 py-6">
              <X className="w-5 h-5 ml-2" />
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 py-6 bg-green-600 hover:bg-green-700">
              {isLoading && <Loader2 className="animate-spin ml-2" />}
              <CheckCircle2 className="w-5 h-5 ml-2" />
              {isLoading ? 'جاري الحفظ...' : 'حفظ الطالب'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
