"use client";

import { useState, useEffect } from "react";
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
import { Course } from "@/lib/types";
import {
  ArrowLeft,
  Loader2,
  X,
  CheckCircle2,
  Users,
  BookOpen,
  User,
  Mail,
  Calendar,
  Phone,
  MapPin,
  FileText,
  GraduationCap,
  School,
} from "lucide-react";
import { useTranslation } from "@/i18n/translation-provider";

const unifiedStudentSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z
    .string()
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female"]),
  isRegular: z.boolean().default(false),
  isSupport: z.boolean().default(false),
  grade: z.string().optional(),
  className: z.string().optional(),
  supportCourseIds: z.array(z.string()).optional(),
  parentName: z.string().min(3, "Parent/Guardian name is required."),
  contact: z.string().min(10, "Please enter a valid contact number."),
  altContact: z.string().optional(),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.string().min(10, "A date of birth is required."),
  medicalNotes: z.string().optional(),
}).refine(
  (data) =>
    data.isRegular || data.isSupport,
  { message: "يجب اختيار برنامج واحد على الأقل" }
).refine(
  (data) =>
    !data.isRegular || (data.grade && data.className),
  { message: "الصف والشعبة مطلوبة للبرنامج العادي" }
).refine(
  (data) =>
    !data.isSupport || (data.supportCourseIds && data.supportCourseIds.length > 0),
  { message: "يجب اختيار برنامج دعم واحد على الأقل" }
);

export default function NewStudentManagementPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [programFilter, setProgramFilter] = useState<"all" | "academic" | "skills">("all");

  const form = useForm<z.infer<typeof unifiedStudentSchema>>({
    resolver: zodResolver(unifiedStudentSchema),
    defaultValues: {
      name: "",
      email: "",
      gender: "male",
      isRegular: false,
      isSupport: false,
      grade: "",
      className: "",
      supportCourseIds: [],
      parentName: "",
      contact: "",
      altContact: "",
      address: "",
      medicalNotes: "",
      dateOfBirth: "",
    },
  });

  const isRegular = form.watch("isRegular");
  const isSupport = form.watch("isSupport");
  const supportCourseIds = form.watch("supportCourseIds") || [];

  useEffect(() => {
    getCoursesByType("support").then((data) => setCourses(data || []));
  }, []);

  const filteredCourses = programFilter === 'all' 
    ? courses 
    : courses.filter(c => c.category === programFilter);

  const selectedCourses = courses.filter((c) =>
    supportCourseIds.includes(c.id)
  );

  const toggleCourse = (courseId: string) => {
    const current = supportCourseIds || [];
    if (current.includes(courseId)) {
      form.setValue(
        "supportCourseIds",
        current.filter((id) => id !== courseId)
      );
    } else {
      form.setValue("supportCourseIds", [...current, courseId]);
    }
  };

  const onSubmit = async (values: z.infer<typeof unifiedStudentSchema>) => {
    setIsLoading(true);
    try {
      const teachers =
        (values.supportCourseIds ?? []).map((courseId) => {
          const course = courses.find((c) => c.id === courseId);
          const firstTeacher = course?.teachers?.[0];
          return {
            courseId,
            teacherId: firstTeacher?.id || "",
            teacherName: firstTeacher?.name || "",
          };
        });

      // Determine primary student type for storage
      const studentType: "regular" | "support" = isRegular ? "regular" : "support";

      // Ensure required legacy fields
      const grade = isRegular ? (values.grade ?? "") : "N/A";
      const className = isRegular ? (values.className ?? "") : "N/A";

      await addStudent({
        ...values,
        // persist support programs even for regular students
        supportCourseIds: values.supportCourseIds ?? [],
        teachers,
        // maintain legacy field
        studentType,
        grade,
        className,
      });

      toast({
        title: "تم إضافة الطالب بنجاح",
        description: "تم تسجيل الطالب الجديد في النظام",
      });

      router.push("/student-management/directory");
    } catch (error) {
      toast({
        title: "خطأ في إضافة الطالب",
        description: error instanceof Error ? error.message : "حدث خطأ ما",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                <Link href="/student-management/directory">
                  <ArrowLeft className="rotate-180" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">إضافة طالب جديد</h1>
                <p className="text-sm text-slate-500">
                  املأ النموذج أدناه لتسجيل طالب جديد
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/student-management/directory")}
              >
                <X className="w-4 h-4 ml-2" />
                إلغاء
              </Button>
              <Button
                type="submit"
                form="student-form"
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin ml-2 w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                )}
                {isLoading ? "جاري الحفظ..." : "حفظ الطالب"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          id="student-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="container mx-auto px-6 py-8"
        >
          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                البيانات الأساسية للطالب
              </h2>
            </div>

            {/* Card Body - Two Column Grid */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        اسم الطالب الكامل
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: أحمد محمد علي"
                          className="text-right h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-500" />
                        البريد الإلكتروني (اختياري)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="student@example.com"
                          className="text-right h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Gender */}
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        الجنس
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="text-right h-11">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">ذكر</SelectItem>
                          <SelectItem value="female">أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date of Birth */}
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        تاريخ الميلاد
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={
                            field.value
                              ? new Date(field.value)
                                  .toISOString()
                                  .slice(0, 10)
                              : ""
                          }
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? new Date(
                                    e.target.value
                                  ).toISOString()
                                : ""
                            )
                          }
                          className="text-right h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Program Type - Multiple Selection */}
                <div className="md:col-span-2">
                  <FormLabel className="text-slate-700 font-semibold flex items-center gap-2 mb-4">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    اختر نوع البرنامج (يمكن اختيار أكثر من واحد)
                  </FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Regular Program */}
                    <FormField
                      control={form.control}
                      name="isRegular"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-5 h-5 accent-blue-600"
                          />
                          <div className="flex-1">
                            <FormLabel className="font-semibold text-slate-900 cursor-pointer">
                              برنامج عادي
                            </FormLabel>
                            <p className="text-xs text-slate-600 mt-1">
                              للطلاب المنتظمين مع دراسة الصف والشعبة
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Support Program */}
                    <FormField
                      control={form.control}
                      name="isSupport"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center gap-3 bg-green-50 border-2 border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors">
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="w-5 h-5 accent-green-600"
                          />
                          <div className="flex-1">
                            <FormLabel className="font-semibold text-slate-900 cursor-pointer">
                              برنامج دعم
                            </FormLabel>
                            <p className="text-xs text-slate-600 mt-1">
                              لاختيار برامج الدعم الإضافية
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Grade & Class - Only for Regular */}
                {isRegular && (
                  <>
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                            <School className="w-4 h-4 text-blue-500" />
                            الصف
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="مثال: 7"
                              className="text-right h-11"
                              {...field}
                            />
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
                          <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                            <School className="w-4 h-4 text-blue-500" />
                            الشعبة
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="مثال: أ"
                              className="text-right h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                {/* Parent Name */}
                <FormField
                  control={form.control}
                  name="parentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500" />
                        اسم ولي الأمر
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="مثال: محمد أحمد"
                          className="text-right h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact */}
                <FormField
                  control={form.control}
                  name="contact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        رقم التواصل
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+212 600-000000"
                          className="text-right h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alternative Contact */}
                <FormField
                  control={form.control}
                  name="altContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                        <Phone className="w-4 h-4 text-blue-500" />
                        رقم بديل (اختياري)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+212 600-000001"
                          className="text-right h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Address - Full Width */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          العنوان الكامل
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="العنوان الكامل"
                            className="text-right min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Medical Notes - Full Width */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="medicalNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700 font-semibold flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          ملاحظات طبية (اختياري)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="مثال: حساسية من الفول السوداني"
                            className="text-right min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Support Programs Section */}
          {isSupport && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden mt-6">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    برامج الدعم
                  </h2>
                  <div className="flex gap-2 bg-white/20 backdrop-blur-sm rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setProgramFilter("all")}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                        programFilter === "all"
                          ? "bg-white text-green-700"
                          : "text-white hover:bg-white/30"
                      }`}
                    >
                      الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgramFilter("academic")}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                        programFilter === "academic"
                          ? "bg-white text-green-700"
                          : "text-white hover:bg-white/30"
                      }`}
                    >
                      أكاديمي
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgramFilter("skills")}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                        programFilter === "skills"
                          ? "bg-white text-green-700"
                          : "text-white hover:bg-white/30"
                      }`}
                    >
                      مهارات
                    </button>
                  </div>
                </div>
                {supportCourseIds.length > 0 && (
                  <div className="mt-3 flex items-center gap-2 text-white/90 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم اختيار {supportCourseIds.length} برنامج</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                  {filteredCourses.map((course) => {
                    const isSelected = supportCourseIds.includes(course.id);
                    return (
                      <div
                        key={course.id}
                        onClick={() => toggleCourse(course.id)}
                        className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                          isSelected
                            ? "border-green-500 bg-green-50 shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCourse(course.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-4 left-4 w-5 h-5 accent-green-600"
                        />
                        <div className="mr-8">
                          <h4 className="font-bold text-slate-900 mb-2 text-base">
                            {course.name}
                          </h4>
                          {course.description && (
                            <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                          {course.teachers?.[0] && (
                            <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 rounded-md px-2 py-1">
                              <Users className="w-4 h-4 text-green-600" />
                              <span className="font-medium">
                                {course.teachers[0].name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {selectedCourses.length > 0 && (
                  <div className="mt-6 bg-green-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center gap-2 mb-3 font-semibold text-green-900">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      البرامج المختارة ({selectedCourses.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourses.map((course) => (
                        <div
                          key={course.id}
                          className="flex items-center gap-2 bg-white border-2 border-green-500 rounded-full px-4 py-2 text-sm font-medium shadow-sm"
                        >
                          <span>{course.name}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleCourse(course.id);
                            }}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </Form>
    </div>
  );
}
