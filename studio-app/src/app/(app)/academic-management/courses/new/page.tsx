
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { addCourse } from "@/services/courseService";
import { getStaffMembers } from "@/services/staffService";
import type { Staff } from "@/lib/types";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const courseSchema = z.object({
    name: z.string().min(3, "اسم المقرر مطلوب."),
    description: z.string().min(5, "الوصف مطلوب."),
    credits: z.coerce.number().min(1, "عدد الساعات مطلوب."),
    department: z.string().min(2, "القسم مطلوب."),
    grade: z.string().min(1, "الصف مطلوب."),
    type: z.enum(["academic", "support"]),
    teachers: z.array(z.string()).min(1, "يرجى اختيار معلم واحد على الأقل."),
});

export default function NewCoursePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: "",
      description: "",
      credits: 1,
      department: "",
      grade: "",
      type: "academic",
      teachers: [],
    },
  });

  useEffect(() => {
    getStaffMembers().then((data) => {
      setStaff(data.filter((s) => s.role === "teacher"));
    });
  }, []);

  const onSubmit = async (values: z.infer<typeof courseSchema>) => {
    setIsLoading(true);
    try {
      const selectedTeachers = staff.filter((t) => values.teachers.includes(t.id)).map(t => ({ id: t.id, name: t.name }));
      await addCourse({
        name: values.name,
        description: values.description,
        credits: values.credits,
        department: values.department,
        grade: values.grade,
        type: values.type,
        teachers: selectedTeachers,
      });
      toast({
        title: "Course Created",
        description: `Course '${values.name}' was created successfully!`,
      });
      router.push("/academic-management/courses");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          العودة
        </Button>
      </div>
      <div className="glass-card p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2" style={{
            background: 'var(--primary-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>إضافة مقرر جديد</h2>
          <p className="text-sm text-muted-foreground">
            يرجى تعبئة النموذج لإضافة مقرر جديد.
          </p>
        </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>اسم المقرر</FormLabel>
                    <FormControl>
                      <Input className="glass-input" placeholder="مثال: الرياضيات" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>الوصف</FormLabel>
                    <FormControl>
                      <Textarea className="glass-input" placeholder="وصف المقرر..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>عدد الساعات</FormLabel>
                    <FormControl>
                      <Input className="glass-input" type="number" min={1} placeholder="مثال: 3" {...field} />
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
                    <FormLabel>القسم الأكاديمي</FormLabel>
                    <FormControl>
                      <Input className="glass-input" placeholder="مثال: العلوم" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input className="glass-input" placeholder="مثال: 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع المقرر</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="academic">أكاديمي</SelectItem>
                        <SelectItem value="support">دعم</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="teachers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المعلمين</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto border rounded p-2">
                        {staff.map((teacher) => (
                          <label key={teacher.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              name="teachers"
                              checked={field.value.includes(teacher.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  field.onChange([...field.value, teacher.id]);
                                } else {
                                  field.onChange(field.value.filter((id) => id !== teacher.id));
                                }
                              }}
                            />
                            <span>{teacher.name}</span>
                          </label>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="btn-gradient btn-click-effect">
                {isLoading ? "جاري الإنشاء..." : "إنشاء المقرر"}
              </Button>
            </form>
          </Form>
      </div>
    </div>
  );
}
