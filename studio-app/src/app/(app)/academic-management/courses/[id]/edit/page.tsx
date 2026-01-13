
"use client";

import { useEffect, useState } from "react";
import { useRouter, notFound, useParams } from "next/navigation";
import { useTranslation } from "@/i18n/translation-provider";
import Link from "next/link";
import { useForm } from "react-hook-form";
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
import { getCourse, updateCourse } from "@/services/courseService";
import { getStaffMembers } from "@/services/staffService";
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { Course } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
// دالة وهمية مؤقتة - استبدل بنداء الذكاء الاصطناعي
const generateCourseDescription = async (): Promise<string> => {
  return "هذا وصف مقرر وهمي لأغراض الاختبار.";
};
const courseSchema = z.object({
  name: z.string().min(3, "يجب أن يكون اسم المقرر 3 أحرف على الأقل."),
  teacher: z.string().min(3, "يجب أن يكون اسم المعلم 3 أحرف على الأقل."),
  department: z.string().min(1, "يرجى اختيار قسماً."),
  grade: z.string().min(1, "يرجى اختيار مستوى دراسياً."),
  credits: z.coerce.number().min(1, "يجب أن تكون الساعات المعتمدة 1 على الأقل.").max(5, "لا يمكن أن تتجاوز الساعات المعتمدة 5."),
  description: z.string().min(10, "يجب أن يكون الوصف 10 أحرف على الأقل."),
});

export default function EditCoursePage() {
  const params = useParams();
  const id = params?.id as string;
  const { toast } = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [teachers, setTeachers] = useState<Array<{id: string, name: string}>>([]);

  // declare form (hook) before any early return
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
  });
  // Effects/hooks first
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const staff = await getStaffMembers();
        const teachersList = staff
          .filter(s => s.role === 'teacher')
          .map(s => ({ id: s.id, name: s.name }));
        setTeachers(teachersList);
      } catch (error) {
        console.error('فشل في جلب المعلمين:', error);
      }
    };
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (!id) return;
    const fetchCourse = async () => {
      setIsLoading(true);
      try {
        const fetchedCourse = await getCourse(id);
        if (fetchedCourse) {
          setCourse(fetchedCourse);
          form.reset(fetchedCourse);
        } else {
          notFound();
        }
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في جلب بيانات المقرر.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourse();
  }, [id, form, toast]);

  if (!id) { return <div>لم يتم العثور على معرّف.</div>; }

  async function onSubmit(values: z.infer<typeof courseSchema>) {
    setIsSaving(true);
    try {
      await updateCourse(id, values);
      toast({
        title: "تم التحديث",
        description: `تم تحديث المقرر "${values.name}" بنجاح.`,
      });
      router.push(`/academic-management/courses/${id}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل تحديث المقرر. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const handleGenerateDescription = async () => {
    const courseName = form.getValues("name");
    if (!courseName) {
      toast({ title: t('common.invalidInput'), variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const result = { description: "وصف المقرر الوهمي" };
      form.setValue("description", result.description, { shouldValidate: true });
    } catch (error) {
      toast({ title: t('common.error'), variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  }
  
  if (isLoading || !course) {
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
            <Link href={`/academic-management/courses/${id}`}>
            <ArrowLeft />
            <span className="sr-only">{t('common.back') || 'رجوع'}</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">تحرير معلومات المقرر</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تحرير: {course.name}</CardTitle>
          <CardDescription>
            حدّث معلومات المقرر أدناه.
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
                    <FormLabel>اسم المقرر</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: الرياضيات المتقدمة" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teacher"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المعلم</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر معلماً" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.name}>
                            {teacher.name}
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
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>القسم</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر قسماً" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mathematics">الرياضيات</SelectItem>
                        <SelectItem value="English">الإنجليزية</SelectItem>
                        <SelectItem value="Science">العلوم</SelectItem>
                        <SelectItem value="History">التاريخ</SelectItem>
                        <SelectItem value="Arts">الفنون</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المستوى الدراسي</FormLabel>
                    <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-600 font-medium">
                      الصف {field.value}
                    </div>
                    <p className="text-xs text-muted-foreground">المستوى الدراسي محدد مسبقاً ولا يمكن تغييره</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                     <div className="flex justify-between items-center">
                        <FormLabel>الوصف</FormLabel>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateDescription}
                            disabled={isGenerating}
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                            {isGenerating ? "...يتم التوليد" : "توليد باستخدام الذكاء الاصطناعي"}
                        </Button>
                    </div>
                    <FormControl>
                      <Textarea rows={5} placeholder="قدّم ملخصاً موجزاً للمقرر..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isSaving || isGenerating}>
                  {isSaving && <Loader2 className="animate-spin" />}
                  {isSaving ? "...يتم الحفظ" : "حفظ التغييرات"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
