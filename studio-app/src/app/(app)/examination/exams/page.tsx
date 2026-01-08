
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  GlassModal,
  GlassModalContent,
  GlassModalDescription,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalTrigger,
} from "@/components/ui/glass-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { addExam, getExams, updateExam, deleteExam } from "@/services/examService";
import type { Exam, Course, ClassInfo } from "@/lib/types";
import { Loader2, PlusCircle, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCourses } from "@/services/courseService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getStudents } from "@/services/studentService";


const examSchema = z.object({
    courseId: z.string().min(1, "يرجى اختيار مقرر"),
    title: z.string().min(3, "عنوان الامتحان مطلوب"),
    examDate: z.date({ required_error: "تاريخ الامتحان مطلوب"}),
    duration: z.coerce.number().positive("المدة يجب أن تكون رقم موجب"),
    room: z.string().optional(),
    instructions: z.string().optional(),
    classes: z.array(z.string()).min(1, "يرجى اختيار فصل واحد على الأقل"),
});

export default function ExamsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<z.infer<typeof examSchema>>({
    resolver: zodResolver(examSchema),
    defaultValues: {
        title: "",
        courseId: "",
        duration: 60,
        room: "",
        instructions: "",
        classes: [],
    }
  });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedExams, fetchedCourses, allStudents] = await Promise.all([
        getExams(),
        getCourses(),
        getStudents()
      ]);
      setExams(fetchedExams);
      setCourses(fetchedCourses);
      
      // Extract unique classes from students
      const uniqueClasses = new Map<string, ClassInfo>();
      allStudents.forEach((student: any) => {
        if (student.className && student.grade) {
          const classKey = `${student.grade}-${student.className}`;
          if (!uniqueClasses.has(classKey)) {
            uniqueClasses.set(classKey, {
              id: classKey,
              grade: student.grade,
              className: student.className,
              studentCount: 0
            });
          }
        }
      });
      setClasses(Array.from(uniqueClasses.values()).sort((a, b) => a.id.localeCompare(b.id)));
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch exam data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  async function onSubmit(values: z.infer<typeof examSchema>) {
    setIsSubmitting(true);
    try {
        const selectedCourse = courses.find(c => c.id === values.courseId);
        if (!selectedCourse) {
            toast({ title: "Error", description: "Invalid course selected.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

      const examData = {
        ...values,
        examDate: values.examDate.toISOString(),
        courseName: selectedCourse.name
      };

      if (editingId) {
        await updateExam(editingId, examData);
        toast({ title: "تم التحديث", description: `تم تحديث الامتحان "${values.title}".` });
        setEditingId(null);
      } else {
        await addExam(examData);
        toast({ title: "تم الجدولة", description: `تم جدولة الامتحان "${values.title}".` });
      }

      fetchPageData();
      form.reset({ title: "", courseId: "", duration: 60, room: "", instructions: "" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "فشل في معالجة الامتحان",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEdit = (exam: Exam) => {
    setEditingId(exam.id);
    form.reset({
      title: exam.title,
      courseId: exam.courseId,
      examDate: new Date(exam.examDate),
      duration: exam.duration,
      room: (exam as any).room || "",
      instructions: (exam as any).instructions || "",
      classes: (exam as any).classes || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (examId: string) => {
    setIsDeleting(true);
    try {
      await deleteExam(examId);
      toast({ title: "تم الحذف", description: "تم حذف الامتحان بنجاح." });
      fetchPageData();
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف الامتحان.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    form.reset({ title: "", courseId: "", duration: 60, room: "", instructions: "", classes: [] });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>جدول الامتحانات</CardTitle>
            <CardDescription>
              جدولة وإدارة جميع الامتحانات القادمة
            </CardDescription>
          </div>
          <GlassModal open={isDialogOpen} onOpenChange={(open) => {
            if (!open) handleCloseDialog();
            setIsDialogOpen(open);
          }}>
            <GlassModalTrigger asChild>
              <Button className="btn-glass-primary btn-click-effect">
                <PlusCircle />
                جدولة امتحان جديد
              </Button>
            </GlassModalTrigger>
            <GlassModalContent className="sm:max-w-[500px]">
              <GlassModalHeader>
                <GlassModalTitle>{editingId ? "تحديث الامتحان" : "جدولة امتحان جديد"}</GlassModalTitle>
                <GlassModalDescription>
                  {editingId ? "عدّل تفاصيل الامتحان" : "أدخل تفاصيل الامتحان الجديد"}
                </GlassModalDescription>
              </GlassModalHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                   <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>المقرر</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر مقرر" /></SelectTrigger></FormControl>
                            <SelectContent>
                                {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>عنوان الامتحان</FormLabel>
                        <FormControl><Input className="glass-input" placeholder="مثال: امتحان منتصف الفصل" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="examDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>تاريخ الامتحان</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal text-xs",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>اختر التاريخ</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" side="top" sideOffset={4}>
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المدة (دقائق)</FormLabel>
                          <FormControl><Input className="glass-input text-xs" type="number" placeholder="60" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="room"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>القاعة</FormLabel>
                          <FormControl><Input className="glass-input text-xs" placeholder="قاعة أ" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="classes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الفصول الدراسية</FormLabel>
                        <Select
                          value={field.value?.[0] || ""}
                          onValueChange={(value) => {
                            const currentClasses = field.value || [];
                            if (currentClasses.includes(value)) {
                              field.onChange(currentClasses.filter(c => c !== value));
                            } else {
                              field.onChange([...currentClasses, value]);
                            }
                          }}
                        >
                          <SelectTrigger className="glass-input">
                            <SelectValue placeholder="اختر فصول..." />
                          </SelectTrigger>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.id} {field.value?.includes(cls.id) ? "✓" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {field.value && field.value.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {field.value.map((classId: string) => (
                              <span key={classId} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded flex items-center gap-1">
                                {classId}
                                <button
                                  type="button"
                                  onClick={() => field.onChange(field.value.filter((c: string) => c !== classId))}
                                  className="ml-1 hover:text-blue-600"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تعليمات خاصة</FormLabel>
                        <FormControl><textarea className="glass-input text-xs resize min-h-24" rows={3} placeholder="تعليمات خاصة بالامتحان..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleCloseDialog}>إلغاء</Button>
                    <Button type="submit" disabled={isSubmitting} className="btn-gradient btn-click-effect">
                      {isSubmitting && <Loader2 className="animate-spin" />}
                      {isSubmitting ? "...يتم المعالجة" : editingId ? "تحديث" : "جدولة"}
                    </Button>
                  </div>
                </form>
              </Form>
            </GlassModalContent>
          </GlassModal>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {exams.length > 0 ? (
                exams.map((exam) => (
                  <Card key={exam.id} className="border-r-4 border-r-blue-500 hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">التاريخ</p>
                          <p className="font-bold">{format(new Date(exam.examDate), "dd MMM")}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(exam.examDate), "HH:mm")}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">الامتحان</p>
                          <p className="font-bold text-sm">{exam.title}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">المقرر</p>
                          <p className="text-sm">{exam.courseName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">الفصول</p>
                          <div className="flex flex-wrap gap-1">
                            {((exam as any).classes || []).map((classId: string) => (
                              <span key={classId} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{classId}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">المدة / القاعة</p>
                          <p className="text-sm">{exam.duration} دقيقة{(exam as any).room ? ` • ${(exam as any).room}` : ""}</p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(exam)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف الامتحان</AlertDialogTitle>
                                <AlertDialogDescription>
                                  هل أنت متأكد من حذف "{exam.title}"؟ هذا الإجراء لا يمكن التراجع عنه.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="flex gap-3 justify-end">
                                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(exam.id)}
                                  disabled={isDeleting}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {isDeleting ? <Loader2 className="animate-spin h-4 w-4" /> : "حذف"}
                                </AlertDialogAction>
                              </div>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {(exam as any).instructions && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground font-semibold">التعليمات</p>
                          <p className="text-sm text-muted-foreground">{(exam as any).instructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  لا يوجد امتحانات مجدولة بعد.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
