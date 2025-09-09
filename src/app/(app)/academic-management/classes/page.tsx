
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudents } from "@/services/studentService";
import { Loader2, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Student, ClassInfo } from "@/lib/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const students = await getStudents();
        const classesMap = new Map<string, { grade: string, className: string, studentCount: number }>();

        students.forEach((student) => {
          if (student.status === 'active' && student.grade && student.className) {
             const classId = `${student.grade}-${student.className}`;
             if (classesMap.has(classId)) {
                const existingClass = classesMap.get(classId)!;
                existingClass.studentCount += 1;
             } else {
                classesMap.set(classId, {
                    grade: student.grade,
                    className: student.className,
                    studentCount: 1
                });
             }
          }
        });

        const sortedClasses = Array.from(classesMap.values())
          .map((classData) => {
              return { id: `${classData.grade}-${classData.className}`, ...classData };
          })
          .sort((a, b) => parseInt(a.grade) - parseInt(b.grade) || a.className.localeCompare(b.className));
        
        setClasses(sortedClasses);

      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch class data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassData();
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Classes Overview</CardTitle>
          <CardDescription>
            A summary of all active classes in the school.
          </CardDescription>
        </CardHeader>
        <CardContent>
             {isLoading ? (
                <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : classes.length === 0 ? (
                <div className="py-12 text-center">
                    <h3 className="text-lg font-medium">No classes found.</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                        Once students are added to classes, they will appear here.
                    </p>
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Grade</TableHead>
                            <TableHead>Class Name</TableHead>
                            <TableHead>Number of Students</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classes.map(classInfo => (
                            <TableRow key={classInfo.id}>
                                <TableCell className="font-medium">Grade {classInfo.grade}</TableCell>
                                <TableCell>{classInfo.className}</TableCell>
                                <TableCell>{classInfo.studentCount}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" asChild>
                                        <Link href={`/academic-management/classes/${classInfo.id}/roster`}>View Roster</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
