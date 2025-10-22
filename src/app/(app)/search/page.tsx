"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, BookOpen, Search } from "lucide-react";
import { getActiveStudents } from "@/services/studentService";
import { getStaffMembers } from "@/services/staffService";
import { getCourses } from "@/services/courseService";
import { Student, Staff, Course } from '@/lib/types';
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams?.get('q') || '';
  const [results, setResults] = useState<{ students: Student[]; staff: Staff[]; courses: Course[] }>({ students: [], staff: [], courses: [] });
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults({ students: [], staff: [], courses: [] });
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('Starting search for:', query);
        const [students, staff, courses] = await Promise.all([
          getActiveStudents(),
          getStaffMembers(),
          getCourses()
        ]);
        
        console.log('Search data loaded:', { 
          studentsCount: students.length, 
          staffCount: staff.length, 
          coursesCount: courses.length 
        });
        
        // Debug: Show sample data
        if (students.length > 0) {
          console.log('Sample student:', students[0]);
        }
        if (staff.length > 0) {
          console.log('Sample staff:', staff[0]);
        }
        if (courses.length > 0) {
          console.log('Sample course:', courses[0]);
        }

        const searchTerm = query.toLowerCase();
        
        const filteredStudents = students.filter(student => {
          if (!student) return false;
          const studentString = JSON.stringify(student).toLowerCase();
          return studentString.includes(searchTerm);
        });

        const filteredStaff = staff.filter(member => {
          if (!member) return false;
          const memberString = JSON.stringify(member).toLowerCase();
          return memberString.includes(searchTerm);
        });

        const filteredCourses = courses.filter(course => {
          if (!course) return false;
          const courseString = JSON.stringify(course).toLowerCase();
          return courseString.includes(searchTerm);
        });

        setResults({
          students: filteredStudents,
          staff: filteredStaff,
          courses: filteredCourses
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  const totalResults = results.students.length + results.staff.length + results.courses.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5" />
        <h1 className="text-2xl font-bold">{t('search.title')}</h1>
        {query && <Badge variant="outline">{t('search.for')} "{query}"</Badge>}
      </div>

      {isLoading ? (
        <div className="text-center py-8">{t('search.searching')}</div>
      ) : (
        <>
          {!query.trim() ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('search.noQueryMessage')}
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('search.noResultsMessage')} "{query}"
            </div>
          ) : (
            <div className="space-y-6">
              {results.students.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {t('search.students')} ({results.students.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {results.students.map((student) => (
                      <Link key={student.id} href={`/student-management/directory/${student.id}`}>
                        <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {t('search.grade')}: {student.grade} • {student.email}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {results.staff.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      {t('search.staff')} ({results.staff.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {results.staff.map((member) => (
                      <Link key={member.id} href={`/staff-management/directory/${member.id}`}>
                        <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                          <div className="font-medium">{member.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {member.role} • {member.email}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {results.courses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {t('search.courses')} ({results.courses.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {results.courses.map((course) => (
                      <Link key={course.id} href={`/academic-management/courses/${course.id}`}>
                        <div className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                          <div className="font-medium">{course.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.name} • {course.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
