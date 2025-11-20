"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getClubSignupRequests, updateClubSignupRequestStatus } from "@/services/clubService";
import { getStudent } from "@/services/studentService";
import { getCourse } from "@/services/courseService";
import type { Course } from "@/lib/types";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function ClubSignupRequestsPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const reqs = await getClubSignupRequests();
        // enrich with student and course names
        const enriched = await Promise.all(reqs.map(async (r: any) => {
          const student = r.studentId ? await getStudent(r.studentId).catch(() => null) : null;
          const course: Course | null = r.courseId ? await getCourse(r.courseId).catch(() => null) : null;
          return { ...r, studentName: student?.name || r.studentId, courseName: course?.name || r.courseId };
        }));
        if (mounted) setRequests(enriched);
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "Could not fetch club signup requests.", variant: "destructive" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void fetch();
    return () => { mounted = false };
  }, [toast]);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    setIsUpdating(true);
    const original = [...requests];
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    try {
      await updateClubSignupRequestStatus(id, newStatus);
      toast({ title: newStatus === 'approved' ? 'Request approved' : 'Request rejected', description: '' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to update request status.', variant: 'destructive' });
      setRequests(original);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>طلبات الانضمام للأندية</CardTitle>
            <CardDescription>راجع وادِر طلبات انضمام الطلاب للأندية والدورات اللامنهجية.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">جاري التحميل...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>النشاط</TableHead>
                  <TableHead>المقدم</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length > 0 ? requests.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell>{r.courseName}</TableCell>
                    <TableCell>{r.parentName || '-'}</TableCell>
                    <TableCell>{r.createdAt ? format(new Date(r.createdAt), 'PPP') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === 'approved' ? 'default' : r.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(r.id, 'approved')} disabled={isUpdating}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />موافقة
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(r.id, 'rejected')} disabled={isUpdating}>
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />رفض
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">لا توجد طلبات.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
