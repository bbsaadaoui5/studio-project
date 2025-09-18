
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Course } from "@/lib/types";
import { getCoursesByType } from "@/services/courseService";
import { BookCopy, PlusCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

export default function SupportCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const fetchedCourses = await getCoursesByType("support");
        setCourses(fetchedCourses);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not fetch support courses.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCourses();
  }, [toast]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">Support Program Courses</h1>
            <p className="text-muted-foreground">Manage all non-academic, support, and extracurricular courses.</p>
        </div>
        <Button asChild className="btn-glass-primary btn-click-effect">
            <Link href="/support-programs/courses/new">
                <PlusCircle />
                <span>Add New Support Course</span>
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
                <h3 className="text-lg font-medium">No support courses found.</h3>
                <p className="text-sm text-muted-foreground mt-2">
                    Get started by adding a new course for your support programs.
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
                </CardContent>
                <CardFooter className="flex justify-end p-4 pt-0">
                    <Button variant="outline" asChild className="btn-glass btn-click-effect">
                    <Link href={`/support-programs/courses/${course.id}`}>View Details</Link>
                    </Button>
                </CardFooter>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
}
