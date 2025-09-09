
"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Student, AttendanceStatus } from "@/lib/types";
import { getStudents, getStudentsByClass } from "@/services/studentService";
import { saveAttendance, getAttendance } from "@/services/attendanceService";
import { Loader2, CalendarIcon, Save } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function AttendancePage() {
  const { toast } = useToast();
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const fetchedStudents = await getStudents();
        setAllStudents(fetchedStudents.filter(s => s.status === 'active'));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch student data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [toast]);

  const grades = useMemo(() => [...new Set(allStudents.map(s => s.grade))].sort((a,b) => parseInt(a)-parseInt(b)), [allStudents]);
  
  const classNamesForGrade = useMemo(() => {
    if (!selectedGrade) return [];
    return [...new Set(allStudents.filter(s => s.grade === selectedGrade).map(s => s.className))].sort();
  }, [allStudents, selectedGrade]);

  useEffect(() => {
    // Reset class when grade changes
    setSelectedClass("");
  }, [selectedGrade]);

  useEffect(() => {
    const fetchClassStudentsAndAttendance = async () => {
      if (!selectedGrade || !selectedClass) {
        setStudentsInClass([]);
        setAttendance({});
        return;
      }
      setIsLoading(true);
      try {
        // Fetch students in the selected class
        const students = await getStudentsByClass(selectedGrade, selectedClass);
        const activeStudents = students.filter(s => s.status === 'active');
        setStudentsInClass(activeStudents);

        // Fetch existing attendance for the selected class and date
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const attendanceRecord = await getAttendance(selectedGrade, selectedClass, dateString);
        if (attendanceRecord) {
            setAttendance(attendanceRecord.studentRecords);
        } else {
            // Default to 'present' if no record exists
            const initialAttendance: Record<string, AttendanceStatus> = {};
            activeStudents.forEach(student => {
                initialAttendance[student.id] = 'present';
            });
            setAttendance(initialAttendance);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch data for the selected class and date.",
          variant: "destructive",
        });
        setStudentsInClass([]);
        setAttendance({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassStudentsAndAttendance();
  }, [selectedGrade, selectedClass, selectedDate, toast]);
  
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: AttendanceStatus) => {
    const newAttendance: Record<string, AttendanceStatus> = {};
    studentsInClass.forEach(student => {
        newAttendance[student.id] = status;
    });
    setAttendance(newAttendance);
  }

  const handleSaveAttendance = async () => {
    if (!selectedGrade || !selectedClass) {
        toast({ title: "Please select a grade and class.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        await saveAttendance({
            grade: selectedGrade,
            className: selectedClass,
            date: dateString,
            studentRecords: attendance,
            studentIds: studentsInClass.map(s => s.id)
        });
        toast({
            title: "Attendance Saved",
            description: `Attendance for Grade ${selectedGrade} - ${selectedClass} on ${format(selectedDate, "PPP")} has been saved.`
        });
    } catch (error) {
         toast({
            title: "Error",
            description: "Failed to save attendance. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Take Attendance by Class</CardTitle>
          <CardDescription>
            Select a grade, class, and date to mark student attendance.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
           <div className="space-y-2">
            <Label>Select Grade</Label>
            <Select onValueChange={setSelectedGrade} value={selectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select a grade" />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    Grade {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label>Select Class</Label>
            <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classNamesForGrade.map((className) => (
                  <SelectItem key={className} value={className}>
                    Class {className}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
             <Label>Select Date</Label>
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date || new Date())}
                    initialFocus
                />
                </PopoverContent>
            </Popover>
           </div>
        </CardContent>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && selectedGrade && selectedClass && studentsInClass.length > 0 && (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Attendance Sheet</CardTitle>
                        <CardDescription>
                            Class: Grade {selectedGrade} - {selectedClass} | Date: {format(selectedDate, "PPP")}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => markAll('present')}>Mark All Present</Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {studentsInClass.map((student) => (
                        <div key={student.id} className="flex flex-col md:flex-row md:items-center md:justify-between rounded-md border p-4">
                            <p className="font-medium">{student.name}</p>
                            <RadioGroup 
                                value={attendance[student.id] || 'present'}
                                onValueChange={(value) => handleStatusChange(student.id, value as AttendanceStatus)}
                                className="flex items-center gap-4 mt-2 md:mt-0"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="present" id={`${student.id}-present`} />
                                    <Label htmlFor={`${student.id}-present`}>Present</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                                    <Label htmlFor={`${student.id}-absent`}>Absent</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="late" id={`${student.id}-late`} />
                                    <Label htmlFor={`${student.id}-late`}>Late</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <Button onClick={handleSaveAttendance} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                        {isSaving ? "Saving..." : "Save Attendance"}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

       {!isLoading && selectedGrade && selectedClass && studentsInClass.length === 0 && (
         <Card>
            <CardContent className="py-12 text-center">
                <h3 className="text-lg font-medium">No Students Found</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    There are no active students in this class to take attendance for.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
