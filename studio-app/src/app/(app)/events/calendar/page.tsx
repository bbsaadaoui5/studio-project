
"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SchoolEvent } from "@/lib/types";
import { addEvent, getEvents } from "@/services/eventService";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, PlusCircle, Bell } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTranslation } from "@/i18n/translation-provider";
import { getAnnouncementsByStatus } from "@/services/announcementService";
import type { Announcement } from "@/lib/types";

export default function CalendarPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const eventSchema = z.object({
    title: z.string().min(3, t("events.titleRequired")),
    description: z.string().min(3, t("events.descriptionRequired")),
    date: z.date({ required_error: t("events.dateRequired") }),
    category: z.enum(["holiday", "exam", "meeting", "activity"]),
  });

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      category: "activity",
    },
  });

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedEvents, activeAnnouncements, scheduledAnnouncements] = await Promise.all([
        getEvents(),
        getAnnouncementsByStatus("active"),
        getAnnouncementsByStatus("scheduled")
      ]);

      // Merge active + scheduled (scheduled needed for future eventDate markers)
      const mergedAnnouncements = [...activeAnnouncements, ...scheduledAnnouncements].reduce<Record<string, Announcement>>( (acc, a) => {
        acc[a.id] = a;
        return acc;
      }, {});

      setEvents(fetchedEvents);
      setAnnouncements(Object.values(mergedAnnouncements));
    } catch (error) {
      toast({ title: t("common.error"), description: t("events.failedToLoad"), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onSubmit = async (values: z.infer<typeof eventSchema>) => {
    setIsSubmitting(true);
    try {
      await addEvent({
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
      });
      toast({ title: t("events.eventCreated"), description: t("events.eventCreatedDesc") });
      await fetchEvents();
      form.reset({
        title: "",
        description: "",
        date: new Date(),
        category: "activity",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: t("common.error"), description: t("events.failedToCreate"), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventsForDay = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    return events.filter(e => e.date === formattedDay);
  };

  const getAnnouncementsForDay = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    return announcements.filter(a => {
      if (a.eventDate) {
        const eventDay = format(new Date(a.eventDate), "yyyy-MM-dd");
        return formattedDay === eventDay;
      }
      const publishDate = format(new Date(a.publishDate), "yyyy-MM-dd");
      const expiryDate = format(new Date(a.expiryDate), "yyyy-MM-dd");
      return formattedDay >= publishDate && formattedDay <= expiryDate;
    });
  };

  const selectedDayEvents = date ? getEventsForDay(date) : [];
  const selectedDayAnnouncements = date ? getAnnouncementsForDay(date) : [];

  const categoryColors: Record<SchoolEvent['category'], string> = {
    holiday: 'bg-green-500',
    exam: 'bg-red-500',
    meeting: 'bg-blue-500',
    activity: 'bg-yellow-500'
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>تقويم الفعاليات</CardTitle>
            <CardDescription>إدارة جميع الفعاليات والمناسبات المدرسية</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button aria-label={t('events.add') || 'Add event'}>
                <PlusCircle /> <span className="sr-only">{t('events.add') || 'Add event'}</span>
                إضافة فعالية
              </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة فعالية</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>عنوان الفعالية</FormLabel><FormControl><Input placeholder="عنوان الفعالية" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>الوصف</FormLabel><FormControl><Textarea placeholder="وصف الفعالية..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
            )} />
                  <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>تاريخ الفعالية</FormLabel>
                          <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>اختر التاريخ</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl>
                          </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent></Popover><FormMessage />
                        </FormItem>
                     )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>الفئة</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="holiday">عطلة</SelectItem>
                                <SelectItem value="exam">امتحان</SelectItem>
                                <SelectItem value="meeting">اجتماع</SelectItem>
                                <SelectItem value="activity">نشاط</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <DialogFooter className="pt-4"><Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "إنشاء الفعالية"}
                  </Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-3">
           <Card>
            <CardContent className="p-2 flex justify-center">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="w-full"
                components={{
                  DayContent: ({ date }) => {
                    const dayEvents = getEventsForDay(date);
                    const dayAnnouncements = getAnnouncementsForDay(date);
                    const totalItems = dayEvents.length + dayAnnouncements.length;
                    return (
                      <div className="relative h-full w-full">
                        <span className="relative z-10">{format(date, 'd')}</span>
                        {totalItems > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-0">
                            {dayEvents.slice(0, 2).map((e, index) => (
                              <div key={`${e.id}-${index}`} className={`h-1.5 w-1.5 rounded-full ${categoryColors[e.category]}`}></div>
                            ))}
                            {dayAnnouncements.length > 0 && (
                              <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
        <div className="xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>الفعاليات والإعلانات ليوم {date ? format(date, "PPP") : "اليوم"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-4 pr-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin" /></div>
                ) : (selectedDayEvents.length > 0 || selectedDayAnnouncements.length > 0) ? (
                  <>
                    {selectedDayAnnouncements.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
                          <Bell className="w-4 h-4" /> الإعلانات
                        </h4>
                        {selectedDayAnnouncements.map(announcement => (
                          <div key={announcement.id} className="p-4 border-l-4 border-purple-500 rounded-r-lg mb-2 bg-purple-50 dark:bg-purple-950/20">
                            <div className="font-semibold flex items-center gap-2">
                              <span>📢 {announcement.title}</span>
                              {announcement.priority === "urgent" && <Badge variant="destructive" className="text-xs">عاجل</Badge>}
                              {announcement.priority === "important" && <Badge className="text-xs bg-orange-500">مهم</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{announcement.content}</p>
                            <Badge variant="secondary" className="mt-2 capitalize text-xs">إعلان</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    {selectedDayEvents.length > 0 && (
                      <div>
                        {selectedDayAnnouncements.length > 0 && <h4 className="font-semibold text-sm mb-2 mt-4">الفعاليات</h4>}
                        {selectedDayEvents.map(event => (
                          <div key={event.id} className="p-4 border-l-4 rounded-r-lg mb-2" style={{ borderLeftColor: `hsl(var(--chart-${Object.keys(categoryColors).indexOf(event.category) + 1}))` }}>
                            <p className="font-semibold">{event.title}</p>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <Badge variant="secondary" className="mt-2 capitalize">{event.category}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground text-center pt-12">لا توجد فعاليات أو إعلانات لهذا اليوم</p>
                )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
