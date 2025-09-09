
"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getStudents } from "@/services/studentService";
import { getStaffMembers } from "@/services/staffService";
import { Student, Staff } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, User, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q");

  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!query) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [allStudents, allStaff] = await Promise.all([
          getStudents(),
          getStaffMembers(),
        ]);

        const lowerCaseQuery = query.toLowerCase();

        const filteredStudents = allStudents.filter(
          (s) =>
            s.name.toLowerCase().includes(lowerCaseQuery) ||
            s.email?.toLowerCase().includes(lowerCaseQuery)
        );
        setStudents(filteredStudents);

        const filteredStaff = allStaff.filter(
          (s) =>
            s.name.toLowerCase().includes(lowerCaseQuery) ||
            (s.email && s.email.toLowerCase().includes(lowerCaseQuery))
        );
        setStaff(filteredStaff);

      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [query]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('');
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!query) {
    return <div className="text-center text-muted-foreground">Please enter a search term in the top bar.</div>;
  }
  
  const totalResults = students.length + staff.length;

  return (
    <div className="flex flex-col gap-6">
       <Card>
        <CardHeader>
          <CardTitle>Search Results</CardTitle>
          <CardDescription>
            Found {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><User /> Students ({students.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {students.length > 0 ? (
                     <div className="space-y-4">
                        {students.map(student => (
                             <Link key={student.id} href={`/student-management/directory/${student.id}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://picsum.photos/seed/${student.id}/100/100`} data-ai-hint="student photo" />
                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-sm text-muted-foreground">{student.email}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No students found.</p>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Briefcase /> Staff ({staff.length})</CardTitle>
            </CardHeader>
            <CardContent>
                {staff.length > 0 ? (
                    <div className="space-y-4">
                        {staff.map(member => (
                            <Link key={member.id} href={`/staff-management/directory/${member.id}`} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={`https://picsum.photos/seed/${member.id}/100/100`} data-ai-hint="staff photo" />
                                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.email}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ): (
                    <p className="text-sm text-muted-foreground text-center py-8">No staff members found.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
