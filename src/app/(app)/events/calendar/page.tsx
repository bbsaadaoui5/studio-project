
"use client";

import { useEffect, useState } from "react";
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
import { CalendarIcon, Loader2, PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const eventSchema = z.object({
  title: z.string().min(3, "Title is required."),
  description: z.string().min(3, "Description is required."),
  date: z.date({ required_error: "An event date is required." }),
  category: z.enum(["holiday", "exam", "meeting", "activity"]),
});

export default function CalendarPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      category: "activity",
    },
  });

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
    } catch (error) {
      toast({ title: "Error", description: "Could not fetch events.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [toast]);

  const onSubmit = async (values: z.infer<typeof eventSchema>) => {
    setIsSubmitting(true);
    try {
      await addEvent({
        ...values,
        date: format(values.date, "yyyy-MM-dd"),
      });
      toast({ title: "Event Created", description: "The new event has been added to the calendar." });
      await fetchEvents();
      form.reset({
        title: "",
        description: "",
        date: new Date(),
        category: "activity",
      });
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to create event.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEventsForDay = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    return events.filter(e => e.date === formattedDay);
  };

  const selectedDayEvents = date ? getEventsForDay(date) : [];

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
            <CardTitle>School Calendar</CardTitle>
            <CardDescription>View and manage all school events.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle /> Add Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New School Event</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Event Title</FormLabel><FormControl><Input placeholder="e.g., Parent-Teacher Meeting" {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                     <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe the event..." {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>Date</FormLabel>
                          <Popover><PopoverTrigger asChild>
                            <FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button></FormControl>
                          </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent></Popover><FormMessage />
                        </FormItem>
                     )} />
                    <FormField control={form.control} name="category" render={({ field }) => (
                        <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="holiday">Holiday</SelectItem>
                                <SelectItem value="exam">Exam</SelectItem>
                                <SelectItem value="meeting">Meeting</SelectItem>
                                <SelectItem value="activity">School Activity</SelectItem>
                            </SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <DialogFooter className="pt-4"><Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Create Event"}
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
                    return (
                      <div className="relative h-full w-full">
                        <span className="relative z-10">{format(date, 'd')}</span>
                        {dayEvents.length > 0 && (
                          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-0">
                            {dayEvents.slice(0, 3).map((e, index) => (
                              <div key={`${e.id}-${index}`} className={`h-1.5 w-1.5 rounded-full ${categoryColors[e.category]}`}></div>
                            ))}
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
              <CardTitle>Events for {date ? format(date, "PPP") : "Today"}</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px]">
                <div className="space-y-4 pr-4">
                {isLoading ? (
                  <div className="flex justify-center items-center py-12"><Loader2 className="animate-spin" /></div>
                ) : selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map(event => (
                    <div key={event.id} className="p-4 border-l-4 rounded-r-lg" style={{ borderLeftColor: `hsl(var(--chart-${Object.keys(categoryColors).indexOf(event.category) + 1}))` }}>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      <Badge variant="secondary" className="mt-2 capitalize">{event.category}</Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center pt-12">No events scheduled for this day.</p>
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
