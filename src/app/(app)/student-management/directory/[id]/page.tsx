
"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { getStudent } from "@/services/studentService";
import { Student } from "@/lib/types";
import { getCourse } from "@/services/courseService";
import { format } from "date-fns";

export default function StudentProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;
    if (!id) { return <div>ID not found</div>; }
    const [student, setStudent] = useState<Student | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [supportCourse, setSupportCourse] = useState<any>(null);

    useEffect(() => {
      if (!id) return;

      const getStudentData = async () => {
        setIsLoading(true);
        try {
            const studentData = await getStudent(id);
            if (!studentData) {
                notFound();
                return;
            }
            setStudent(studentData);
            // If support program, fetch course
            if (studentData.studentType === 'support' && studentData.supportCourseId) {
                const course = await getCourse(studentData.supportCourseId);
                setSupportCourse(course);
            } else {
                setSupportCourse(null);
            }
        } catch (error) {
            console.error("Could not fetch student details:", error);
        } finally {
            setIsLoading(false);
        }
      }

      getStudentData();
    }, [id]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!student) {
      return notFound();
    }

    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('');
    }

    return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/student-management/directory')}>
                <ArrowLeft />
                <span className="sr-only">Back to Directory</span>
            </Button>
            <h1 className="text-2xl font-bold">Student Profile</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push(`/student-management/directory/${student.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Student
                </Button>
            </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-start gap-6 space-y-0">
              <Avatar className="h-24 w-24">
                  <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} data-ai-hint="student photo" />
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                  <CardTitle className="text-3xl">{student.name}</CardTitle>
                  <CardDescription className="text-lg">{student.email || 'No email provided'}</CardDescription>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className="text-sm capitalize">{student.status}</Badge>
                      {student.studentType === 'regular' ? (
                        <Badge variant="secondary" className="capitalize">Grade {student.grade} - Class {student.className}</Badge>
                      ) : (
                        <Badge variant="secondary" className="capitalize">Support Program</Badge>
                      )}
                      {student.studentType === 'support' && supportCourse && (
                        <>
                          <Badge variant="secondary" className="capitalize">Course: {supportCourse.name}</Badge>
                          <Badge variant="secondary" className="capitalize">Teacher: {supportCourse.teacher}</Badge>
                        </>
                      )}
                      <Badge variant="outline" className="capitalize">{student.gender}</Badge>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-muted-foreground">Student ID</p>
                          <p className="font-medium">{student.id}</p>
                          <p className="text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">{student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : 'N/A'}</p>
                          <p className="text-muted-foreground">Enrollment Date</p>
                          <p className="font-medium">{student.enrollmentDate ? format(new Date(student.enrollmentDate), "PPP") : 'N/A'}</p>
                           <p className="text-muted-foreground col-span-2">Address</p>
                          <p className="font-medium col-span-2">{student.address}</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Guardian Information</h3>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-muted-foreground">Parent Name</p>
                          <p className="font-medium">{student.parentName}</p>
                          <p className="text-muted-foreground">Contact</p>
                          <p className="font-medium">{student.contact}</p>
                           <p className="text-muted-foreground">Alt. Contact</p>
                          <p className="font-medium">{student.altContact || "N/A"}</p>
                      </div>
                  </div>
                   <div className="md:col-span-2 space-y-4">
                     <h3 className="text-lg font-semibold">Medical Notes</h3>
                     <Separator />
                     <p className="text-sm text-muted-foreground">{student.medicalNotes || "No medical notes provided."}</p>
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>
    );
}
