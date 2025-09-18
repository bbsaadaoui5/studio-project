
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Course } from "@/lib/types";
import { getCoursesByGrade } from "@/services/courseService";
import { BookOpenCheck, PlusCircle, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function CoursesByGradePage() {
  const params = useParams();
  const router = useRouter();
  if (!params?.grade) { return <div>Grade parameter not found</div>; }
const grade = params.grade as string;
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!grade) {
        notFound();
        return;
    };
    const fetchCourses = async () => {
      try {
        const fetchedCourses = await getCoursesByGrade(grade);
        setCourses(fetchedCourses);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch courses for this grade. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [grade, toast]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/academic-management/courses">
                    <ArrowLeft />
                    <span className="sr-only">Back to Grades</span>
                </Link>
            </Button>
            <div>
                <h1 className="text-2xl font-bold">Course Catalog</h1>
                <p className="text-muted-foreground">Showing all courses for Grade {grade}.</p>
            </div>
        </div>
        <Button asChild>
            <Link href={`/academic-management/courses/new?grade=${grade}`}>
                <PlusCircle />
                <span>Add New Course for Grade {grade}</span>
            </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : courses.length === 0 ? (
         <Card>
            <CardContent className="py-12 text-center">
                <h3 className="text-lg font-medium">No courses found for Grade {grade}.</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Get started by adding a new course.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
                <Card key={course.id} className="flex flex-col">
                <CardHeader>
                    <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-xl">{course.name}</CardTitle>
                        <CardDescription>{course.teacher}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                        {course.department}
                    </Badge>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                    {course.description}
                    </p>
                     <div className="flex justify-end items-center text-sm">
                        <span className="font-medium text-muted-foreground">
                        Credits:{" "}
                        <span className="font-semibold text-foreground">
                            {course.credits}
                        </span>
                        </span>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end p-4 pt-0">
                    <Button variant="outline" asChild>
                    <Link href={`/academic-management/courses/${course.id}`}>View Details</Link>
                    </Button>
                </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
