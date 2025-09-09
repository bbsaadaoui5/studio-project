
"use client";

import { useEffect, useState } from "react";
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
  reviewerName: z.string().min(3, "Reviewer name is required."),
  summary: z.string().min(10, "Summary must be at least 10 characters."),
  rating: z.coerce.number().min(1).max(5),
});

export default function ReviewsPage() {
  const { toast } = useToast();
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

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const fetchedStaff = await getStaffMembers();
        setStaffList(fetchedStaff.filter((s) => s.status === "active"));
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch staff list.",
          variant: "destructive",
        });
      }
    };
    fetchStaff();
  }, [toast]);

  useEffect(() => {
    if (!selectedStaff) {
      setReviews([]);
      return;
    }
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const fetchedReviews = await getReviewsForStaff(selectedStaff.id);
        setReviews(fetchedReviews);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch reviews for this staff member.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchReviews();
  }, [selectedStaff, toast]);
  
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
        toast({ title: "Review Added", description: "The performance review has been saved." });
        const fetchedReviews = await getReviewsForStaff(selectedStaff.id);
        setReviews(fetchedReviews);
        form.reset({ reviewerName: "", summary: "", rating: 3 });
        setIsDialogOpen(false);
    } catch (error) {
        toast({ title: "Error", description: "Failed to save the review.", variant: "destructive" });
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
            <CardTitle>Select Staff Member</CardTitle>
            <CardDescription>
              Choose a staff member to view or add a performance review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select onValueChange={handleSelectStaff} value={selectedStaff?.id || ''}>
              <SelectTrigger>
                <SelectValue placeholder="Select staff..." />
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
              <CardTitle>Performance Reviews</CardTitle>
              <CardDescription>
                {selectedStaff ? `Showing reviews for ${selectedStaff.name}` : "Select a staff member to see their reviews."}
              </CardDescription>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button disabled={!selectedStaff}>
                        <PlusCircle />
                        Add Review
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Review for {selectedStaff?.name}</DialogTitle>
                        <DialogDescription>
                            Fill out the performance review details below.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                             <FormField
                                control={form.control}
                                name="reviewerName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Your Name (Reviewer)</FormLabel>
                                    <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Overall Rating</FormLabel>
                                    <Select onValueChange={(val) => field.onChange(parseInt(val))} value={String(field.value)}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {[...Array(5)].map((_, i) => <SelectItem key={i+1} value={String(i+1)}>{i+1} Star(s)</SelectItem>)}
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
                                    <FormLabel>Review Summary</FormLabel>
                                    <FormControl>
                                        <Textarea rows={5} placeholder="Provide constructive feedback..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="animate-spin" />}
                                    Submit Review
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
                  {selectedStaff ? "No reviews found for this staff member." : "Please select a staff member to begin."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
