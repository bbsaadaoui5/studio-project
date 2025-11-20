
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getStaffMembers } from "@/services/staffService";
import { getReviewsForStaff, addStaffReview } from "@/services/reviewService";
import type { Staff, StaffReview } from "@/lib/types";
import { Loader2, PlusCircle, Star } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";

const reviewSchema = z.object({
  reviewerName: z.string().min(3, "اسم المراجع مطلوب."),
  summary: z.string().min(10, "يجب أن يكون الملخص 10 أحرف على الأقل."),
  rating: z.coerce.number().min(1).max(5),
});

export default function StaffReviewsPage() {
  // ...existing code...
  const { toast } = useToast();
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      reviewerName: "",
      summary: "",
      rating: 3,
    },
  });

  const fetchStaff = useCallback(async () => {
    try {
      const fetchedStaff = await getStaffMembers();
      setStaffList(fetchedStaff.filter((s) => s.status === "active"));
    } catch (error) {
      toast({
        title: t('staff.reviews.error'),
        description: t('staff.reviews.couldNotFetchStaff'),
        variant: "destructive",
      });
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  const fetchReviews = useCallback(async (staffId?: string) => {
    if (!staffId) {
      setReviews([]);
      return;
    }
    setIsLoading(true);
    try {
      const fetchedReviews = await getReviewsForStaff(staffId);
      setReviews(fetchedReviews);
    } catch (error) {
      toast({
        title: t('staff.reviews.error'),
        description: t('staff.reviews.couldNotFetchReviews'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchReviews(selectedStaff?.id);
  }, [selectedStaff, fetchReviews]);
  
  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
        await addStaffReview({
            ...values,
            staffId: selectedStaff.id,
            staffName: selectedStaff.name,
            reviewDate: new Date().toISOString()
        });
        toast({ title: t('staff.reviews.reviewAdded'), description: t('staff.reviews.reviewSaved') });
        const fetchedReviews = await getReviewsForStaff(selectedStaff.id);
        setReviews(fetchedReviews);
        form.reset({ reviewerName: "", summary: "", rating: 3 });
        setIsDialogOpen(false);
    } catch (error) {
        toast({ title: t('staff.reviews.error'), description: t('staff.reviews.failedToSaveReview'), variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handleSelectStaff = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId) || null;
    setSelectedStaff(staff);
  }
  
  const renderStars = (rating: number) => {
    return (
        <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < rating ? 'fill-current' : ''}`} />
            ))}
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>اختر الموظف</CardTitle>
            <CardDescription>
              اختر الموظف الذي ترغب في عرض تقييماته أو إضافة تقييم جديد له
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleSelectStaff} value={selectedStaff?.id || ''}>
              <SelectTrigger>
                <SelectValue placeholder="اختر موظف..." />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff.id} value={staff.id}>
                    {staff.name} - ({staff.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>تقييمات الأداء</CardTitle>
              <CardDescription>
                {selectedStaff ? `عرض التقييمات لـ ${selectedStaff.name}` : "يرجى اختيار موظف أولاً"}
              </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button disabled={!selectedStaff}>
                        <PlusCircle />
                        إضافة تقييم
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
            <DialogTitle>إضافة تقييم جديد لـ {selectedStaff?.name}</DialogTitle>
            <DialogDescription>
              يرجى تعبئة تفاصيل التقييم أدناه
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="reviewerName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>اسم المراجع</FormLabel>
                                    <FormControl><Input placeholder="اسم المراجع" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>التقييم العام</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {[...Array(5)].map((_, i) => <SelectItem key={i+1} value={String(i+1)}>{i+1} نجوم</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="summary"
                                render={({ field }) => (
                                <FormItem>
                  <FormLabel>ملخص التقييم</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="اكتب ملخص التقييم هنا..." {...field} />
                  </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" />}
                                    {isSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reviews.length > 0 ? (
                <div className="space-y-6">
                    {reviews.map(review => (
                        <div key={review.id} className="space-y-3">
                           <div className="flex justify-between items-center">
                             {renderStars(review.rating)}
                             <span className="text-xs text-muted-foreground">{format(new Date(review.reviewDate), "PPP")}</span>
                           </div>
                           <p className="text-sm text-muted-foreground italic">"{review.summary}"</p>
                           <p className="text-xs text-right font-medium">- {review.reviewerName}</p>
                           <Separator />
                        </div>
                    ))}
                </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>
                  {selectedStaff ? "لا توجد تقييمات لهذا الموظف" : "اختر موظفًا للبدء"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
