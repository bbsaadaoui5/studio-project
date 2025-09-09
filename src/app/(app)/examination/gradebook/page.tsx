
"use client";

import { useState, useEffect } from "react";
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
import { Loader2, PlusCircle, Save } from "lucide-react";
import { Course, Student, Assignment, Grade } from "@/lib/types";
import { getCourses } from "@/services/courseService";
import { useToast } from "@/hooks/use-toast";
import { getEnrollmentForCourse } from "@/services/enrollmentService";
import { getStudent } from "@/services/studentService";
import { getAssignmentsForCourse, addAssignment, saveGrades, getGrades } from "@/services/gradeService";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function GradebookPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, { score: number | null }>>({});

  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");

  const [newAssignmentName, setNewAssignmentName] = useState("");
  const [newAssignmentPoints, setNewAssignmentPoints] = useState(100);

  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
  const [isDialogOpwn, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const fetchedCourses = await getCourses();
        setCourses(fetchedCourses);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch courses.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, [toast]);

  useEffect(() => {
    if (!selectedCourse) {
      setAssignments([]);
      setSelectedAssignment("");
      return;
    }
    const fetchAssignments = async () => {
      setIsLoadingAssignments(true);
      try {
        const fetchedAssignments = await getAssignmentsForCourse(selectedCourse);
        setAssignments(fetchedAssignments);
      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch assignments.", variant: "destructive" });
      } finally {
        setIsLoadingAssignments(false);
      }
    };
    fetchAssignments();
  }, [selectedCourse, toast]);

  useEffect(() => {
    if (!selectedCourse || !selectedAssignment) {
      setEnrolledStudents([]);
      setGrades({});
      return;
    }

    const fetchStudentsAndGrades = async () => {
      setIsLoadingStudents(true);
      try {
        const enrollment = await getEnrollmentForCourse(selectedCourse);
        if (enrollment && enrollment.studentIds.length > 0) {
          const studentPromises = enrollment.studentIds.map(id => getStudent(id));
          const students = await Promise.all(studentPromises);
          setEnrolledStudents(students.filter(s => s) as Student[]);
        } else {
            setEnrolledStudents([]);
        }

        const gradeData = await getGrades(selectedAssignment);
        setGrades(gradeData?.studentGrades || {});

      } catch (error) {
        toast({ title: "Error", description: "Failed to fetch students or grades.", variant: "destructive" });
        setEnrolledStudents([]);
        setGrades({});
      } finally {
        setIsLoadingStudents(false);
      }
    };

    fetchStudentsAndGrades();
  }, [selectedCourse, selectedAssignment, toast]);

  const handleCreateAssignment = async () => {
      if (!selectedCourse || !newAssignmentName) {
          toast({title: "Error", description: "Course and assignment name are required.", variant: "destructive"});
          return;
      }
      setIsCreatingAssignment(true);
      try {
          const newAssignment = {
              courseId: selectedCourse,
              name: newAssignmentName,
              totalPoints: newAssignmentPoints,
          }
          const assignmentId = await addAssignment(newAssignment);
          setAssignments(prev => [...prev, { ...newAssignment, id: assignmentId }]);
          setSelectedAssignment(assignmentId);
          toast({ title: "Assignment Created", description: `"${newAssignmentName}" has been added.`});
          setNewAssignmentName("");
          setNewAssignmentPoints(100);
          setIsDialogOpen(false);
      } catch (error) {
          toast({ title: "Error", description: "Failed to create assignment.", variant: "destructive" });
      } finally {
          setIsCreatingAssignment(false);
      }
  }
  
  const handleGradeChange = (studentId: string, score: string) => {
    const newScore = score === "" ? null : Number(score);
    if (newScore !== null && isNaN(newScore)) return;

    setGrades(prev => ({
        ...prev,
        [studentId]: { score: newScore }
    }));
  };

  const handleSaveGrades = async () => {
    if(!selectedAssignment) return;
    setIsSaving(true);
    try {
        await saveGrades(selectedAssignment, grades);
        toast({title: "Grades Saved", description: "The grades have been successfully saved."});
    } catch (error) {
        toast({title: "Error", description: "Failed to save grades.", variant: "destructive"});
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gradebook</CardTitle>
          <CardDescription>
            Select a course and assignment to view or enter grades.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Select Course</Label>
            <Select onValueChange={setSelectedCourse} value={selectedCourse} disabled={isLoadingCourses}>
              <SelectTrigger>
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name} - {course.teacher}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2">
            <Label>Select Assignment</Label>
             <div className="flex gap-2">
                <Select onValueChange={setSelectedAssignment} value={selectedAssignment} disabled={!selectedCourse || isLoadingAssignments}>
                <SelectTrigger>
                    <SelectValue placeholder="Select an assignment" />
                </SelectTrigger>
                <SelectContent>
                    {assignments.map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.name}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
                <Dialog open={isDialogOpwn} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" disabled={!selectedCourse}>
                        <PlusCircle className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                    <DialogTitle>Create New Assignment</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new assignment for course: {courses.find(c => c.id === selectedCourse)?.name}
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="assignment-name" className="text-right">Name</Label>
                            <Input id="assignment-name" value={newAssignmentName} onChange={e => setNewAssignmentName(e.target.value)} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="total-points" className="text-right">Total Points</Label>
                            <Input id="total-points" type="number" value={newAssignmentPoints} onChange={e => setNewAssignmentPoints(Number(e.target.value))} className="col-span-3" />
                        </div>
                    </div>
                    <DialogFooter>
                    <Button onClick={handleCreateAssignment} disabled={isCreatingAssignment}>
                        {isCreatingAssignment && <Loader2 className="animate-spin" />}
                        Create Assignment
                    </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {isLoadingStudents && (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoadingStudents && selectedCourse && selectedAssignment && (
        <Card>
            <CardHeader>
                <CardTitle>{assignments.find(a => a.id === selectedAssignment)?.name} - Grade Sheet</CardTitle>
                <CardDescription>
                   Enter scores for each student. Total Points: {assignments.find(a => a.id === selectedAssignment)?.totalPoints}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {enrolledStudents.map(student => (
                        <div key={student.id} className="flex items-center justify-between rounded-md border p-4">
                            <p className="font-medium">{student.name}</p>
                            <Input 
                                type="text"
                                className="w-24"
                                placeholder="Score"
                                value={grades[student.id]?.score ?? ""}
                                onChange={(e) => handleGradeChange(student.id, e.target.value)}
                            />
                        </div>
                    ))}
                </div>
                 <div className="flex justify-end mt-6">
                    <Button onClick={handleSaveGrades} disabled={isSaving}>
                        {isSaving && <Loader2 className="animate-spin" />}
                        {isSaving ? "Saving..." : "Save Grades"}
                        {!isSaving && <Save />}
                    </Button>
                </div>
            </CardContent>
        </Card>
      )}

      {!isLoadingStudents && selectedCourse && enrolledStudents.length === 0 && (
         <Card>
            <CardContent className="py-12 text-center">
                <h3 className="text-lg font-medium">No Students Enrolled</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Enroll students in this course to start grading.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
