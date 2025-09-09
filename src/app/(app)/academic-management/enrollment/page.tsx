
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Course, Student } from "@/lib/types";
import { getCourses } from "@/services/courseService";
import { getStudents } from "@/services/studentService";
import { enrollStudentsInCourse, getEnrollmentForCourse, enrollStudentInCourses, getCoursesForStudent } from "@/services/enrollmentService";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EnrollmentPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // State for "Enroll by Course"
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedStudentsForCourse, setSelectedStudentsForCourse] = useState<string[]>([]);
  
  // State for "Enroll by Student"
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedCoursesForStudent, setSelectedCoursesForStudent] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [fetchedCourses, fetchedStudents] = await Promise.all([
          getCourses(),
          getStudents(),
        ]);
        setCourses(fetchedCourses);
        setStudents(fetchedStudents.filter(s => s.status === 'active'));
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch initial data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  // Effect for "Enroll by Course"
  useEffect(() => {
    const fetchEnrollmentData = async () => {
      if (!selectedCourse) {
          setSelectedStudentsForCourse([]);
          return;
      };
      setIsLoading(true);
      try {
        const enrollment = await getEnrollmentForCourse(selectedCourse);
        setSelectedStudentsForCourse(enrollment?.studentIds || []);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch enrollment data for the selected course.",
          variant: "destructive",
        });
        setSelectedStudentsForCourse([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEnrollmentData();
  }, [selectedCourse, toast]);

  // Effect for "Enroll by Student"
  useEffect(() => {
    const fetchStudentCourses = async () => {
        if (!selectedStudent) {
            setSelectedCoursesForStudent([]);
            return;
        }
        setIsLoading(true);
        try {
            const courseIds = await getCoursesForStudent(selectedStudent.id);
            setSelectedCoursesForStudent(courseIds);
        } catch (error) {
            toast({
              title: "Error",
              description: "Failed to fetch course data for the selected student.",
              variant: "destructive",
            });
            setSelectedCoursesForStudent([]);
        } finally {
            setIsLoading(false);
        }
    };
    fetchStudentCourses();
  }, [selectedStudent, toast]);


  const handleStudentSelectionForCourse = (studentId: string) => {
    setSelectedStudentsForCourse((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };
  
  const handleCourseSelectionForStudent = (courseId: string) => {
    setSelectedCoursesForStudent((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSelectAllStudents = () => {
      const activeStudentIds = students.map(s => s.id);
      if (selectedStudentsForCourse.length === activeStudentIds.length) {
          setSelectedStudentsForCourse([]);
      } else {
          setSelectedStudentsForCourse(activeStudentIds);
      }
  }

  async function handleEnrollByCourse() {
    if (!selectedCourse) {
      toast({ title: "Please select a course.", variant: "destructive" });
      return;
    }
   
    setIsSaving(true);
    try {
      await enrollStudentsInCourse(selectedCourse, selectedStudentsForCourse);
      toast({
        title: "Enrollment Updated",
        description: `Student enrollment for ${courses.find(c=>c.id === selectedCourse)?.name} has been updated.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update enrollment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleEnrollByStudent() {
    if (!selectedStudent) {
      toast({ title: "Please select a student.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
        await enrollStudentInCourses(selectedStudent.id, selectedCoursesForStudent);
        toast({
            title: "Enrollment Updated",
            description: `Course enrollment for ${selectedStudent.name} has been updated.`,
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to update enrollment. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSaving(false);
    }
  }
  
  const handleSelectStudent = (studentId: string) => {
      const student = students.find(s => s.id === studentId) || null;
      setSelectedStudent(student);
  }

  const coursesForStudentGrade = courses.filter(c => c.grade === selectedStudent?.grade);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Student Enrollment</CardTitle>
          <CardDescription>
            Manage student course enrollments either by course or by individual student.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="by-course">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="by-course">Enroll by Course</TabsTrigger>
                    <TabsTrigger value="by-student">Enroll by Student</TabsTrigger>
                </TabsList>
                <TabsContent value="by-course" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>1. Select Course</Label>
                            <Select onValueChange={setSelectedCourse} value={selectedCourse} disabled={isLoading}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a course to manage enrollment" />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map((course) => (
                                <SelectItem key={course.id} value={course.id}>
                                    {course.name} (Grade {course.grade}) - {course.teacher}
                                </SelectItem>
                                ))}
                            </SelectContent>
                            </Select>
                        </div>
                         {selectedCourse && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>2. Select Students</CardTitle>
                                    <CardDescription>Check the box next to each student you want to enroll in this course.</CardDescription>
                                    <div className="flex items-center space-x-2 pt-4">
                                        <Checkbox 
                                            id="select-all-students" 
                                            onCheckedChange={handleSelectAllStudents}
                                            checked={students.length > 0 && selectedStudentsForCourse.length === students.length}
                                        />
                                        <Label htmlFor="select-all-students">Select All Students</Label>
                                    </div>
                                </CardHeader>
                                <Separator />
                                <CardContent className="pt-4">
                                    <ScrollArea className="h-72">
                                        <div className="space-y-4">
                                        {students.map((student) => (
                                            <div key={student.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`student-for-course-${student.id}`}
                                                checked={selectedStudentsForCourse.includes(student.id)}
                                                onCheckedChange={() => handleStudentSelectionForCourse(student.id)}
                                            />
                                            <Label htmlFor={`student-for-course-${student.id}`} className="flex-1 cursor-pointer">
                                                <div className="flex justify-between">
                                                    <span>{student.name}</span>
                                                    <span className="text-muted-foreground text-sm">Grade {student.grade}, Class {student.className}</span>
                                                </div>
                                            </Label>
                                            </div>
                                        ))}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                         )}
                    </div>
                     <div className="flex justify-end mt-4">
                        <Button onClick={handleEnrollByCourse} disabled={!selectedCourse || isSaving || isLoading}>
                            {isSaving ? <Loader2 className="animate-spin" /> : null}
                            Save Changes for Course
                        </Button>
                    </div>
                </TabsContent>
                <TabsContent value="by-student" className="mt-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                             <Label>1. Select Student</Label>
                            <Select onValueChange={handleSelectStudent} value={selectedStudent?.id || ""} disabled={isLoading}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a student to manage their courses" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.name} (Grade {student.grade} - {student.className})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedStudent && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>2. Select Courses for Grade {selectedStudent.grade}</CardTitle>
                                    <CardDescription>Check the boxes to enroll {selectedStudent.name} in courses.</CardDescription>
                                </CardHeader>
                                 <Separator />
                                <CardContent className="pt-4">
                                     <ScrollArea className="h-72">
                                        <div className="space-y-4">
                                        {coursesForStudentGrade.length > 0 ? coursesForStudentGrade.map((course) => (
                                            <div key={course.id} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`course-for-student-${course.id}`}
                                                checked={selectedCoursesForStudent.includes(course.id)}
                                                onCheckedChange={() => handleCourseSelectionForStudent(course.id)}
                                            />
                                            <Label htmlFor={`course-for-student-${course.id}`} className="flex-1 cursor-pointer">
                                                <div className="flex justify-between">
                                                    <span>{course.name}</span>
                                                    <span className="text-muted-foreground text-sm">{course.department} - {course.teacher}</span>
                                                </div>
                                            </Label>
                                            </div>
                                        )) : <p className="text-center text-muted-foreground py-4">No courses found for Grade {selectedStudent.grade}.</p>}
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                     <div className="flex justify-end mt-4">
                        <Button onClick={handleEnrollByStudent} disabled={!selectedStudent || isSaving || isLoading}>
                            {isSaving ? <Loader2 className="animate-spin" /> : null}
                            Save Changes for Student
                        </Button>
                    </div>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
