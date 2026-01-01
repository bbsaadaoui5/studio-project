"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { addStaffMember } from "@/services/staffService";
import { getCourses } from "@/services/courseService";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { Course } from "@/lib/types";

const staffSchema = z.object({
  name: z.string().min(3, "يجب أن يكون الاسم الكامل 3 أحرف على الأقل."),
  courseIds: z.array(z.string()).optional(),
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح.").optional().or(z.literal("")),
  phone: z.string().min(10, "يرجى إدخال رقم هاتف صحيح."),
  altPhone: z.string().optional(),
  gender: z.enum(["male", "female"]),
  address: z.string().min(10, "يرجى إدخال عنوان صحيح."),
  dateOfBirth: z.date({ required_error: "تاريخ الميلاد مطلوب." }),
  qualifications: z.string().min(10, "يرجى إدخال المؤهلات."),
  role: z.enum(["teacher", "admin", "support"]),
  department: z.string().optional(),
  paymentType: z.enum(["salary", "commission", "headcount"]).optional(),
  paymentRate: z.number().optional(),
  salary: z.number().optional(),

});

export default function NewStaffPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();

  React.useEffect(() => {
    getCourses().then(setCourses).catch(console.error);
  }, []);

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      altPhone: "",
      gender: "male",
      address: "",
      qualifications: "",
      role: "teacher",
      department: "",
      paymentType: "salary",
      paymentRate: 0,
      salary: 0,
      courseIds: [],
    },
  });

  async function onSubmit(values: z.infer<typeof staffSchema>) {
    setIsSaving(true);
    try {
      const staffId = await addStaffMember({
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
      });
      
      toast({
  title: "تمت إضافة الأستاذ",
        description: `تمت إضافة ${values.name} إلى دليل الطاقم بنجاح.`,
      });
      router.push(`/staff-management/directory/${staffId}`);
    } catch (error) {
      toast({
        title: "خطأ",
  description: "فشل في إضافة الأستاذ. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <Link href="/staff-management/directory">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
  <h1 className="text-2xl font-bold ml-2">إضافة موظف جديد</h1>
      </div>

      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2" style={{
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>معلومات الأستاذ</h2>
          <p className="text-sm text-muted-foreground">
            يرجى تعبئة البيانات لإضافة أستاذ جديد إلى دليل الطاقم.
          </p>
        </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.fullName")}</FormLabel>
                      <FormControl>
                        <Input className="glass-input" {...field} />
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
                      <FormLabel>{t("common.email")}</FormLabel>
                      <FormControl>
                        <Input className="glass-input" {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.phone")}</FormLabel>
                      <FormControl>
                        <Input className="glass-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="altPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>هاتف بديل (اختياري)</FormLabel>
                      <FormControl>
                        <Input className="glass-input" {...field} value={field.value ?? ""} />
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
                      <FormLabel>{t("common.gender")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الدور</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="teacher">معلم</SelectItem>
                          <SelectItem value="admin">إداري</SelectItem>
                          <SelectItem value="support">دعم</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>تاريخ الميلاد</FormLabel>
                      <FormControl>
                        <Input
                          className="glass-input"
                          type="date"
                          value={field.value ? field.value.toISOString().split('T')[0] : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
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
                      <FormLabel>العنوان</FormLabel>
                      <FormControl>
                        <Textarea className="glass-input" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qualifications"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>المؤهلات</FormLabel>
                      <FormControl>
                        <Textarea className="glass-input" {...field} />
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
                      <FormLabel>القسم</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Mathematics">الرياضيات</SelectItem>
                          <SelectItem value="English">الإنجليزية</SelectItem>
                          <SelectItem value="Science">العلوم</SelectItem>
                          <SelectItem value="History">التاريخ</SelectItem>
                          <SelectItem value="Arts">الفنون</SelectItem>
                          <SelectItem value="Administration">الإدارة</SelectItem>
                          <SelectItem value="Support">الدعم</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نوع الدفع</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="salary">راتب</SelectItem>
                          <SelectItem value="commission">عمولة</SelectItem>
                          <SelectItem value="headcount">حسب العدد</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(form.watch("paymentType") === "salary" || form.watch("paymentType") === "commission") && (
                  <FormField
                    control={form.control}
                    name={form.watch("paymentType") === "salary" ? "salary" : "paymentRate"}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch("paymentType") === "salary" ? "الراتب" : "المعدل"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            className="glass-input"
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {form.watch("role") === "support" && (
                  <FormField
                    control={form.control}
                    name="courseIds"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>المقررات التي سيدرسها</FormLabel>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded p-3">
                          {courses.map((course) => (
                            <div key={course.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={course.id}
                                checked={field.value?.includes(course.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentIds = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentIds, course.id]);
                                  } else {
                                    field.onChange(currentIds.filter(id => id !== course.id));
                                  }
                                }}
                              />
                              <label htmlFor={course.id} className="text-sm">
                                {course.name} ({course.type === "academic" ? `الصف ${course.grade}` : "دعم"})
                              </label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSaving} className="btn-gradient btn-click-effect">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "جاري الإضافة..." : "إضافة الأستاذ"}
                </Button>
              </div>
            </form>
          </Form>
      </div>
    </div>
  );
}