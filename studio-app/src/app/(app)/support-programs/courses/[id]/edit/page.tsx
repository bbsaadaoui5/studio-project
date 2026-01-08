"use client";

import { useEffect, useState } from "react";
import { useRouter, notFound, useParams } from "next/navigation";
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
import { ArrowLeft, Loader2, Wand2 } from "lucide-react";
import { Course } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { generateCourseDescription } from "@/ai/flows/generate-course-description-flow";
import { useTranslation } from "@/i18n/translation-provider";

export default function EditCoursePage() {
  const { t } = useTranslation();
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : undefined;
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const courseSchema = z.object({
    name: z.string().min(3, t('courses.nameMinLength') || "يجب أن يكون اسم المقرر 3 أحرف على الأقل."),
    teacher: z.string().min(3, t('courses.teacherNameMinLength') || "يجب أن يكون اسم الأستاذ 3 أحرف على الأقل."),
    department: z.string().min(1, t('courses.selectDepartment') || "يرجى اختيار القسم."),
    category: z.enum(["academic", "skills"], { required_error: "يجب اختيار تصنيف البرنامج" }),
    description: z.string().min(10, t('courses.descriptionMinLength') || "يجب أن يكون الوصف 10 أحرف على الأقل."),
  });

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      teacher: '',
      department: '',
      category: 'academic',
      description: '',
    },
  });

  useEffect(() => {
    if (!id) {
      setErrorMsg('معرّف المقرر غير صالح أو مفقود.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    getCourse(id)
      .then((fetchedCourse) => {
        if (fetchedCourse && fetchedCourse.type === 'support') {
          // Build a minimal safe object for the form to avoid duplicate-key
          // object literal warnings and ensure fields exist for the controlled inputs.
          const safeCourse = {
            name: fetchedCourse.name ?? '',
            // Derive a single teacher name from the teachers array if present
            teacher: fetchedCourse.teachers?.[0]?.name || '',
            department: fetchedCourse.department ?? '',
            category: fetchedCourse.category ?? 'academic',
            description: fetchedCourse.description ?? '',
          };
          form.reset(safeCourse);
        } else {
          setErrorMsg('لم يتم العثور على مقرر الدعم.');
        }
      })
      .catch(() => {
        setErrorMsg('فشل في جلب بيانات المقرر.');
      })
      .finally(() => {
        setIsLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);


  const onSubmit = async (values: z.infer<typeof courseSchema>) => {
    if (!id) return;
    setIsSaving(true);
    try {
      await updateCourse(id, values);
      toast({
        title: 'تم تحديث المقرر',
        description: `تم تحديث ${values.name} بنجاح.`,
      });
      router.push(`/support-programs/courses/${id}`);
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث المقرر. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleGenerateDescription = async () => {
    const courseName = form.getValues('name');
    if (!courseName) {
      toast({ title: 'يرجى إدخال اسم المقرر أولاً.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    try {
      // Replace with actual AI call if available
      const result = { description: `This is a generated description for ${courseName}.` };
      form.setValue('description', result.description, { shouldValidate: true });
    } catch (error) {
      toast({ title: 'خطأ في توليد الوصف', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };
  

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-destructive">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{errorMsg}</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/support-programs/courses/${id}`}>
            <ArrowLeft />
            <span className="sr-only">{t('common.back') || 'Back'}</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">تعديل مقرر دعم</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تعديل: {form.watch('name') || 'مقرر'}</CardTitle>
          <CardDescription>
            قم بتحديث بيانات المقرر أدناه.
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
                      <Input placeholder="مثال: نادي الروبوتات" {...field} />
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
                    <FormLabel>الأستاذ</FormLabel>
                    <FormControl>
                      <Input placeholder="مثال: فاطمة الفهري" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* تصنيف البرنامج */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>تصنيف البرنامج</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="academic">📚 دعم أكاديمي</SelectItem>
                        <SelectItem value="skills">🎨 مهارات حياتية</SelectItem>
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>القسم / التصنيف</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر التصنيف" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Tutoring">الدروس الخصوصية</SelectItem>
                        <SelectItem value="STEM">العلوم والتقنية</SelectItem>
                        <SelectItem value="Arts & Music">الفنون والموسيقى</SelectItem>
                        <SelectItem value="Sports">الرياضة</SelectItem>
                        <SelectItem value="Languages">اللغات</SelectItem>
                        <SelectItem value="Other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
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
                    </div>
                    <FormControl>
                      <Textarea rows={5} placeholder="اكتب وصف المقرر هنا..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isSaving || isGenerating}>
                  {isSaving && <Loader2 className="animate-spin" />}
                  {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}