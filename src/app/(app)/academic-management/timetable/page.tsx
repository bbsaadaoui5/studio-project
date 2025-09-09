
"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, CalendarDays, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTimetableForClass, addTimetableEntry } from "@/services/timetableService";
import { getCourses } from "@/services/courseService";
import { getStudents } from "@/services/studentService";
import { getSettings } from "@/services/settingsService";
import { Course, TimetableEntry, ClassInfo } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";


const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const timeSlots = [
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
];

const timetableSchema = z.object({
    courseId: z.string().min(1, "Please select a course."),
    day: z.string().min(1, "Please select a day."),
    timeSlot: z.string().min(1, "Please select a time slot."),
    notes: z.string().optional(),
});

export default function TimetablePage() {
  const { toast } = useToast();
  const [allClasses, setAllClasses] = useState<ClassInfo[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof timetableSchema>>({
    resolver: zodResolver(timetableSchema),
    defaultValues: {
        courseId: "",
        day: "",
        timeSlot: "",
        notes: "",
    }
  });

  useEffect(() => {
    // Fetch unique class IDs and all courses
    const fetchInitialData = async () => {
      try {
        const [students, fetchedCourses, settings] = await Promise.all([
            getStudents(),
            getCourses(),
            getSettings()
        ]);
        
        const classesMap = new Map<string, number>();
        students.forEach((student) => {
          if (student.status === 'active') {
             const classId = `${student.grade}-${student.className}`;
             classesMap.set(classId, (classesMap.get(classId) || 0) + 1);
          }
        });
        const classList = Array.from(classesMap.entries())
          .map(([id, studentCount]) => {
              const [grade, className] = id.split('-');
              return { id, grade, className, studentCount };
          })
          .sort((a, b) => parseInt(a.grade) - parseInt(b.grade) || a.className.localeCompare(b.className));
        
        setAllClasses(classList);
        setCourses(fetchedCourses);
        setSchoolName(settings.schoolName);

        if (classList.length > 0) {
            setSelectedClassId(classList[0].id);
        }
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch initial data.", variant: "destructive" });
      }
    };
    fetchInitialData();
  }, [toast]);
  
  const selectedClassInfo = useMemo(() => allClasses.find(c => c.id === selectedClassId), [allClasses, selectedClassId]);

  const fetchTimetable = async (grade: string, className: string) => {
    setIsLoading(true);
    try {
      const fetchedTimetable = await getTimetableForClass(grade, className);
      setTimetable(fetchedTimetable);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch timetable.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (!selectedClassInfo) return;
    fetchTimetable(selectedClassInfo.grade, selectedClassInfo.className);
  }, [selectedClassInfo]);
  
  const getEntryForSlot = (day: string, timeSlot: string) => {
    return timetable.find(entry => entry.day === day && entry.timeSlot === timeSlot);
  }
  
  async function onSubmit(values: z.infer<typeof timetableSchema>) {
    if (!selectedClassInfo) return;
    
    const selectedCourse = courses.find(c => c.id === values.courseId);
    if (!selectedCourse) return;

    setIsSubmitting(true);
    try {
        const newEntry = {
            grade: selectedClassInfo.grade,
            className: selectedClassInfo.className,
            day: values.day as TimetableEntry['day'],
            timeSlot: values.timeSlot,
            courseId: values.courseId,
            courseName: selectedCourse.name,
            teacherName: selectedCourse.teacher,
            notes: values.notes,
        };
        await addTimetableEntry(newEntry);
        toast({ title: "Entry Added", description: "The timetable has been updated."});
        fetchTimetable(selectedClassInfo.grade, selectedClassInfo.className);
        form.reset();
        setIsDialogOpen(false);
    } catch (error) {
         const errorMessage = error instanceof Error ? error.message : "Failed to add timetable entry.";
         toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  const handlePrint = () => {
    window.print();
  }

  return (
    <>
    <div className="flex flex-col gap-6 no-print">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Class Timetables</CardTitle>
                <CardDescription>
                    Select a class to view its weekly schedule.
                </CardDescription>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-48 space-y-2">
                     <Label>Select Class</Label>
                    <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                        <SelectTrigger><SelectValue placeholder="Select Class..." /></SelectTrigger>
                        <SelectContent>
                            {allClasses.map(c => <SelectItem key={c.id} value={c.id}>Grade {c.grade} - {c.className}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button disabled={!selectedClassId}>
                            <PlusCircle />
                            Add Timetable Entry
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Timetable Entry</DialogTitle>
                            <DialogDescription>
                                Schedule a new class for Grade {selectedClassInfo?.grade} - {selectedClassInfo?.className}.
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                               <FormField
                                control={form.control}
                                name="courseId"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Course</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                        {courses.map(course => (
                                            <SelectItem key={course.id} value={course.id}>
                                            {course.name} - {course.teacher}
                                            </SelectItem>
                                        ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="day"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Day of Week</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a day" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="timeSlot"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Time Slot</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select a time slot" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {timeSlots.map(slot => <SelectItem key={slot} value={slot}>{slot}</SelectItem>)}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="notes"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Notes (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="e.g., Lab session, bring textbooks..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter className="pt-4">
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="animate-spin" />}
                                        {isSubmitting ? "Adding..." : "Add to Timetable"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
                <Button variant="outline" onClick={handlePrint} disabled={!selectedClassId || isLoading}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                </Button>
            </div>
        </CardHeader>
      </Card>
      </div>
        <div className="print-area">
            <Card>
                <CardContent className="pt-6">
                    <div className="print-header hidden print:block text-center mb-4">
                        <h1 className="text-xl font-bold">{schoolName}</h1>
                        <h2 className="text-lg font-semibold">Timetable</h2>
                        <p className="text-muted-foreground text-lg">Grade {selectedClassInfo?.grade} - Class {selectedClassInfo?.className}</p>
                    </div>
                    {isLoading && (
                        <div className="flex justify-center items-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                    {!isLoading && selectedClassId && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="grid grid-cols-[1fr_repeat(5,2fr)]">
                                <div className="font-semibold bg-muted p-3 border-b border-r"><CalendarDays className="inline-block mr-2" /> Time</div>
                                {daysOfWeek.map(day => (
                                    <div key={day} className="font-semibold bg-muted p-3 text-center border-b border-r last:border-r-0">{day}</div>
                                ))}

                                {timeSlots.map(timeSlot => (
                                    <div key={timeSlot} className="contents">
                                        <div className="p-3 border-b border-r font-mono text-sm">{timeSlot}</div>
                                        {daysOfWeek.map(day => {
                                            const entry = getEntryForSlot(day, timeSlot);
                                            return (
                                                <div key={`${day}-${timeSlot}`} className="p-3 border-b border-r last:border-r-0 text-center">
                                                    {entry ? (
                                                        <div className="bg-primary/10 text-primary p-2 rounded-md">
                                                            <p className="font-semibold text-sm">{entry.courseName}</p>
                                                            <p className="text-xs">{entry.teacherName}</p>
                                                            {entry.notes && <p className="text-xs italic text-primary/70 mt-1">{entry.notes}</p>}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {!isLoading && !selectedClassId && (
                        <div className="text-center py-12 text-muted-foreground no-print">
                            <p>Please select a class to view the timetable.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
  );
}
