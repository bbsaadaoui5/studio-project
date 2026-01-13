
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
import { useTranslation } from "@/i18n/translation-provider";
import { Student, AttendanceStatus } from "@/lib/types";
import { getStudents, getStudentsByClass } from "@/services/studentService";
import { saveAttendance, getAttendance } from "@/services/attendanceService";
import { Loader2, CalendarIcon, Save } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export default function AttendancePage() {
  const { toast } = useToast();
  const { t } = useTranslation();
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
          title: t("common.error"),
          description: t("attendance.errorFetchingStudents"),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [toast, t]);

  // Ensure no empty grade values end up as SelectItem values
  const grades = useMemo(
    () =>
      [...new Set(
        allStudents
          .map((s) => s.grade)
          .filter((g) => typeof g === 'string' && g.trim() !== '')
      )].sort((a, b) => parseInt(a) - parseInt(b)),
    [allStudents]
  );
  
  const classNamesForGrade = useMemo(() => {
    if (!selectedGrade) return [];
    return [
      ...new Set(
        allStudents
          .filter((s) => s.grade === selectedGrade)
          .map((s) => s.className)
          .filter((c) => typeof c === 'string' && c.trim() !== '')
      ),
    ].sort();
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
    toast({ title: "يرجى اختيار المستوى والقسم أولاً", variant: "destructive" });
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
      title: "تم تسجيل الحضور",
      description: `تسجيل حضور المستوى ${selectedGrade} - القسم ${selectedClass} بتاريخ ${format(selectedDate, "PPP")}`
    });
  } catch (error) {
     toast({
      title: "خطأ",
      description: "فشل في حفظ بيانات الحضور",
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
          <CardTitle>تسجيل الحضور</CardTitle>
          <CardDescription>
            اختر المستوى، القسم، والتاريخ لتسجيل حضور الطلاب.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
           <div className="space-y-2">
            <Label>المستوى الدراسي</Label>
            <Select onValueChange={setSelectedGrade} value={selectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="اختر المستوى الدراسي" />
              </SelectTrigger>
              <SelectContent>
                {grades && grades.length > 0 ? (
                  grades.map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>
                      المستوى {grade}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="placeholder" disabled>
                    لا توجد مستويات متاحة
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label>القسم</Label>
            <Select onValueChange={setSelectedClass} value={selectedClass} disabled={!selectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="اختر القسم" />
              </SelectTrigger>
              <SelectContent>
                {classNamesForGrade && classNamesForGrade.length > 0 ? (
                  classNamesForGrade.map((className) => (
                    <SelectItem key={className} value={String(className)}>
                      القسم {className}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="placeholder" disabled>
                    لا توجد أقسام متاحة
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
             <Label>التاريخ</Label>
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
                    {selectedDate ? format(selectedDate, "PPP") : <span>اختر التاريخ</span>}
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
            <CardTitle>كشف الحضور</CardTitle>
            <CardDescription>
              القسم: المستوى {selectedGrade} - {selectedClass} | التاريخ: {format(selectedDate, "PPP")}
            </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => markAll('present')}>تحديد الكل حاضر</Button>
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
                                    <Label htmlFor={`${student.id}-present`}>حاضر</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                                    <Label htmlFor={`${student.id}-absent`}>غائب</Label>
                                </div>
                                 <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="late" id={`${student.id}-late`} />
                                    <Label htmlFor={`${student.id}-late`}>متأخر</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <Button onClick={handleSaveAttendance} disabled={isSaving}>
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                        {isSaving ? "جاري الحفظ..." : "حفظ الحضور"}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

       {!isLoading && selectedGrade && selectedClass && studentsInClass.length === 0 && (
         <Card>
            <CardContent className="py-12 text-center">
        <h3 className="text-lg font-medium">لا يوجد طلاب</h3>
        <p className="text-sm text-muted-foreground mt-2">
          لا يوجد طلاب نشطون في هذا القسم لتسجيل حضورهم.
        </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
