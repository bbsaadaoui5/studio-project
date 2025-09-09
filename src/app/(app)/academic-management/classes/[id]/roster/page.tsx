
"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getStudentsByClass } from "@/services/studentService";
import { Student } from "@/lib/types";
import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getSettings } from "@/services/settingsService";

export default function ClassRosterPage() {
  const params = useParams();
  const { toast } = useToast();
  const classId = params.id as string;
  const [grade, className] = classId.split('-');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!grade || !className) {
      notFound();
      return;
    }

    const fetchRoster = async () => {
      setIsLoading(true);
      try {
        const [studentList, settings] = await Promise.all([
            getStudentsByClass(grade, className),
            getSettings()
        ]);
        setStudents(studentList);
        setSchoolName(settings.schoolName);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch the class roster.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoster();
  }, [grade, className, toast]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
    <div className="flex flex-col gap-6 no-print">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/academic-management/classes">
              <ArrowLeft />
              <span className="sr-only">Back to Classes</span>
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Class Roster</h1>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" />
          Print Roster
        </Button>
      </div>
      </div>
      
      <div className="print-area">
        <div className="print-header hidden print:block text-center mb-4">
            <h1 className="text-xl font-bold">{schoolName}</h1>
            <h2 className="text-lg font-semibold">Class Roster</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Grade {grade} - Class {className}</CardTitle>
            <CardDescription>
              Showing {students.length} student(s) in this class.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Parent/Guardian</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 no-print">
                                <AvatarImage src={`https://picsum.photos/seed/${student.id}/100/100`} data-ai-hint="student photo" />
                                <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                            </Avatar>
                            <Link href={`/student-management/directory/${student.id}`} className="font-medium hover:underline no-print">
                              {student.name}
                            </Link>
                             <span className="print:block hidden">{student.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.parentName}</TableCell>
                        <TableCell>{student.contact}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No students found in this class.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
