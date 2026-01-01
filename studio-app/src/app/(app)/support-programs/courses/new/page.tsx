
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useEffect } from "react";
import { getStaffMembers } from "@/services/staffService";
import { addCourse } from "@/services/courseService";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/i18n/translation-provider";


export default function NewSupportCoursePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const courseSchema = z.object({
    name: z.string().min(3, t('courses.nameMinLength')),
    teacher: z.string().min(1, t('courses.selectTeacher')),
    department: z.string().min(1, t('courses.selectDepartment')),
    description: z.string(),
  });
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      teacher: "",
      department: "",
      description: "",
    },
  });
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    getStaffMembers().then(staff => {
      // جلب جميع الأساتذة (نظامي ودعم)
      setTeachers(staff.filter(s => s.role === 'teacher').map(s => ({ id: s.id, name: s.name })));
    });
  }, []);

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    setIsLoading(true);
    try {
      await addCourse({
        ...values,
        teachers: [{ id: '', name: values.teacher }],
        type: "support",
        grade: "N/A", // Not applicable for support courses
        credits: 0, // Not applicable for support courses
      });
      toast({
        title: t('supportPrograms.courseCreated'),
        description: t('supportPrograms.courseCreated'),
      });
      router.push(`/support-programs/courses`);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.unexpectedError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/support-programs/courses">
            <ArrowLeft />
            <span className="sr-only">{t('common.back')}</span>
          </Link>
        </Button>
  <h1 className="text-2xl font-bold">إضافة مقرر دعم جديد</h1>
      </div>
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2" style={{
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>إضافة مقرر دعم جديد</h2>
          <p className="text-sm text-muted-foreground">
            يمكنك هنا إضافة مقرر دعم جديد وتحديد تفاصيله.
          </p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* اسم المقرر */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>اسم المقرر</FormLabel>
                  <FormControl>
                    <Input className="glass-input" placeholder="اسم المقرر" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* الأستاذ */}
            <FormField
              control={form.control}
              name="teacher"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الأستاذ</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الأستاذ" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.length > 0 ? (
                          teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.name}>{teacher.name}</SelectItem>
                          ))
                        ) : null}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  {teachers.length === 0 && (
                    <div className="text-xs text-red-500 mt-1">لا يوجد أساتذة برامج الدعم حالياً، يرجى إضافة أستاذ أولاً.</div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* القسم */}
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>القسم</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر القسم" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Tutoring">الدروس الخصوصية</SelectItem>
                        <SelectItem value="STEM">العلوم والتقنية</SelectItem>
                        <SelectItem value="Arts & Music">الفنون والموسيقى</SelectItem>
                        <SelectItem value="Sports">الرياضة</SelectItem>
                        <SelectItem value="Languages">اللغات</SelectItem>
                        <SelectItem value="Other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* الوصف */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>الوصف</FormLabel>
                  <FormControl>
                    <Textarea className="glass-input" rows={5} placeholder="وصف المقرر" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={isLoading || isGenerating} className="btn-gradient btn-click-effect">
                {isLoading && <Loader2 className="animate-spin" />}
                {isLoading ? 'جاري الإضافة...' : 'إضافة مقرر دعم جديد'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
