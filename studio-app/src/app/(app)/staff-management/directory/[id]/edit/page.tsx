
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
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getStaffMember, updateStaffMember } from "@/services/staffService";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Staff } from "@/lib/types";
import { getYear, getMonth, getDate } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

const staffSchema = z.object({
  name: z.string().min(3, "يجب أن يكون الاسم الكامل 3 أحرف على الأقل."),
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح."),
  phone: z.string().min(10, "يرجى إدخال رقم هاتف صحيح."),
  altPhone: z.string().optional(),
  gender: z.enum(["male", "female"]),
  address: z.string().min(10, "يرجى إدخال عنوان صحيح."),
  dateOfBirth: z.date({ required_error: "تاريخ الميلاد مطلوب." }),
  qualifications: z.string().min(10, "يرجى إدخال المؤهلات."),
  role: z.enum(["teacher", "admin", "support"]),
  department: z.string().min(1, "يرجى اختيار القسم."),
  status: z.enum(["active", "inactive"]),
  paymentType: z.enum(["salary", "commission", "headcount"]).optional(),
  paymentRate: z.coerce.number().positive("يجب أن يكون معدل الدفع رقمًا موجبًا.").optional(),
});

const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 18 - i);
const months = [
  { value: 0, label: 'يناير' }, { value: 1, label: 'فبراير' }, { value: 2, label: 'مارس' },
  { value: 3, label: 'أبريل' }, { value: 4, label: 'ماي' }, { value: 5, label: 'يونيو' },
  { value: 6, label: 'يوليوز' }, { value: 7, label: 'غشت' }, { value: 8, label: 'شتنبر' },
  { value: 9, label: 'أكتوبر' }, { value: 10, label: 'نونبر' }, { value: 11, label: 'دجنبر' },
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function EditStaffPage() {
  const params = useParams();
  const id = params?.id as string;
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
  });
  
  const paymentType = form.watch("paymentType");

  const getPaymentRateLabel = () => {
    switch(paymentType) {
        case "salary": return "الراتب الشهري";
        case "commission": return "نسبة العمولة (%)";
        case "headcount": return "الأجر لكل طالب";
        default: return "معدل الدفع";
    }
  }

  useEffect(() => {
    if (!id) return;
    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        const fetchedStaff = await getStaffMember(id);
        if (fetchedStaff) {
          setStaff(fetchedStaff);
          form.reset({
            ...fetchedStaff,
            dateOfBirth: new Date(fetchedStaff.dateOfBirth),
            altPhone: fetchedStaff.altPhone || '',
            paymentRate: fetchedStaff.paymentRate || undefined,
            paymentType: fetchedStaff.paymentType || undefined,
          });
        } else {
          notFound();
        }
      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في تحميل بيانات الموظف.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, [id, form, toast]);

  async function onSubmit(values: z.infer<typeof staffSchema>) {
    setIsSaving(true);
    try {
      await updateStaffMember(id, {
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
      });
      toast({
        title: "تم تحديث الموظف",
        description: `تم تحديث بيانات ${values.name} بنجاح.`,
      });
      router.push(`/staff-management/directory/${id}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث بيانات الموظف. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  if (isLoading || !staff) {
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
          <Link href={`/staff-management/directory/${id}`}>
            <div>
              <ArrowLeft />
              <span className="sr-only">{t("common.backToProfile") || 'Back to profile'}</span>
            </div>
          </Link>
        </Button>
  <h1 className="text-2xl font-bold">تعديل معلومات الطاقم</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>تعديل: {staff.name}</CardTitle>
          <CardDescription>
            قم بتحديث معلومات عضو الطاقم أدناه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input placeholder="مثال: محمد أحمد" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input placeholder="example@email.com" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input placeholder="05XXXXXXXX" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="altPhone" render={({ field }) => (<FormItem><FormLabel>هاتف بديل (اختياري)</FormLabel><FormControl><Input placeholder="05XXXXXXXX" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>الجنس</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="male">ذكر</SelectItem><SelectItem value="female">أنثى</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>الحالة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">نشط</SelectItem><SelectItem value="inactive">غير نشط</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />

              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem className="md:col-span-2">
                    <FormLabel>تاريخ الميلاد</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                        <Controller name="dateOfBirth" control={form.control} render={({ field: dobField }) => (
                          <>
                            <Select onValueChange={(val) => {const d = new Date(dobField.value || Date.now()); d.setFullYear(parseInt(val)); dobField.onChange(d);}} value={String(getYear(dobField.value || Date.now()))}>
                              <FormControl><SelectTrigger><SelectValue placeholder="السنة" /></SelectTrigger></FormControl>
                              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                          </>
                        )}/>
                        <Controller name="dateOfBirth" control={form.control} render={({ field: dobField }) => (
                          <>
                            <Select onValueChange={(val) => {const d = new Date(dobField.value || Date.now()); d.setMonth(parseInt(val)); dobField.onChange(d);}} value={String(getMonth(dobField.value || Date.now()))}>
                              <FormControl><SelectTrigger><SelectValue placeholder="الشهر" /></SelectTrigger></FormControl>
                              <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </>
                        )}/>
                        <Controller name="dateOfBirth" control={form.control} render={({ field: dobField }) => (
                          <>
                            <Select onValueChange={(val) => {const d = new Date(dobField.value || Date.now()); d.setDate(parseInt(val)); dobField.onChange(d);}} value={String(getDate(dobField.value || Date.now()))}>
                              <FormControl><SelectTrigger><SelectValue placeholder="اليوم" /></SelectTrigger></FormControl>
                              <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                          </>
                        )}/>
                    </div>
                    <FormMessage />
                </FormItem>
              )}/>

              <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>العنوان</FormLabel><FormControl><Textarea placeholder="العنوان الكامل" {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>الدور الوظيفي</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="teacher">أستاذ</SelectItem><SelectItem value="admin">إداري</SelectItem><SelectItem value="support">دعم</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>القسم</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Mathematics">الرياضيات</SelectItem><SelectItem value="English">اللغة الإنجليزية</SelectItem><SelectItem value="Science">العلوم</SelectItem><SelectItem value="History">التاريخ</SelectItem><SelectItem value="Arts">الفنون</SelectItem><SelectItem value="Administration">الإدارة</SelectItem><SelectItem value="Support">الدعم</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="paymentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع الدفع</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع الدفع" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="salary">راتب شهري</SelectItem>
                        <SelectItem value="commission">عمولة</SelectItem>
                        <SelectItem value="headcount">لكل طالب</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="paymentRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getPaymentRateLabel()}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="مثال: 10000" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="qualifications" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>المؤهلات</FormLabel><FormControl><Textarea rows={3} placeholder="مثال: إجازة في الرياضيات، دبلوم تربية..." {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="animate-spin" />}
                  {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
