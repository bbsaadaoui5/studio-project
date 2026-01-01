
"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Staff, StaffAttendanceStatus, StaffAttendanceRecord } from "@/lib/types";
import { getStaffMembers } from "@/services/staffService";
import { saveStaffAttendance, getStaffAttendance } from "@/services/attendanceService";
import { getSettings } from "@/services/settingsService";
import { Loader2, CalendarIcon, Save, Printer } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";

export default function StaffAttendancePage() {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [attendance, setAttendance] = useState<Record<string, StaffAttendanceStatus>>({});
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchStaffAndAttendance = async () => {
      setIsLoading(true);
      try {
        // Fetch staff
        const [allStaff, settings] = await Promise.all([
            getStaffMembers(),
            getSettings()
        ]);

        const activeStaff = allStaff.filter(s => s.status === 'active');
        setStaff(activeStaff);
        setSchoolName(settings.schoolName);

        // Fetch existing attendance for the selected date
        const dateString = format(selectedDate, "yyyy-MM-dd");
        const attendanceRecord = await getStaffAttendance(dateString);
        
        if (attendanceRecord) {
            setAttendance(attendanceRecord.staffRecords);
        } else {
            // Default all active staff to 'present' if no record exists
            const initialAttendance: Record<string, StaffAttendanceStatus> = {};
            activeStaff.forEach(member => {
                initialAttendance[member.id] = 'present';
            });
            setAttendance(initialAttendance);
        }

      } catch (error) {
        toast({
          title: "خطأ",
          description: "فشل في جلب بيانات الموظفين أو الحضور",
          variant: "destructive",
        });
        setStaff([]);
        setAttendance({});
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaffAndAttendance();
  }, [selectedDate, toast]);
  
  const handleStatusChange = (staffId: string, status: StaffAttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [staffId]: status }));
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    try {
        const dateString = format(selectedDate, "yyyy-MM-dd");
        await saveStaffAttendance({
            date: dateString,
            staffRecords: attendance
        });
          toast({
              title: "تم حفظ الحضور",
              description: "تم حفظ حضور الموظفين بنجاح."
          });
    } catch (error) {
         toast({
              title: "خطأ",
              description: "فشل في حفظ الحضور. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  }

  // ...existing code...
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>حضور الموظفين</CardTitle>
          <CardDescription>إدارة وتسجيل حضور الموظفين حسب التاريخ</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[260px] justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "اختر التاريخ"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (day) setSelectedDate(day as Date);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          {isLoading && (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {!isLoading && staff.length > 0 && (
            <div className="print-area">
                <Card>
                    <CardHeader className="no-print">
                        <CardTitle>حضور الموظفين</CardTitle>
                        <CardDescription>
                            التاريخ: {format(selectedDate, "PPP")}
                        </CardDescription>
                    </CardHeader>
                     <div className="print-header hidden print:block text-center mb-4">
                        <h1 className="text-xl font-bold">{schoolName}</h1>
                        <h2 className="text-lg font-semibold">تقرير حضور الموظفين</h2>
                        <p className="text-muted-foreground">{format(selectedDate, "PPP")}</p>
                    </div>
                    <CardContent>
                        <div className="space-y-4">
                            {staff.map(member => (
                                <div key={member.id} className="flex flex-col md:flex-row md:items-center md:justify-between rounded-md border p-4 print:border-b print:rounded-none">
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                                    </div>
                                    <RadioGroup 
                                        value={attendance[member.id] || 'present'}
                                        onValueChange={(value) => handleStatusChange(member.id, value as StaffAttendanceStatus)}
                                        className="flex items-center gap-4 mt-2 md:mt-0 no-print"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="present" id={`${member.id}-present`} />
                                            <Label htmlFor={`${member.id}-present`}>حاضر</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="absent" id={`${member.id}-absent`} />
                                            <Label htmlFor={`${member.id}-absent`}>غائب</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="on-leave" id={`${member.id}-on-leave`} />
                                            <Label htmlFor={`${member.id}-on-leave`}>إجازة</Label>
                                        </div>
                                    </RadioGroup>
                                    <div className="hidden print:block text-lg font-semibold capitalize">
                                        {attendance[member.id]?.replace("-", " ")}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-6 no-print">
                            <Button onClick={handleSaveAttendance} disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin" /> : <Save />}
                                {isSaving ? "جاري الحفظ..." : "حفظ الحضور"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
          )}
          {!isLoading && staff.length === 0 && (
            <Card>
                <CardContent className="py-12 text-center">
                    <h3 className="text-lg font-medium">لا يوجد موظفين نشطين</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        لم يتم العثور على موظفين نشطين لهذا اليوم.
                    </p>
                </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
