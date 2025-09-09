
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
import { getStaffMember } from "@/services/staffService";
import { Staff } from "@/lib/types";
import { format } from "date-fns";

export default function StaffProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [staff, setStaff] = useState<Staff | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      if (!id) return;
      const getStaffData = async () => {
          setIsLoading(true);
          try {
              const staffData = await getStaffMember(id);
              if (!staffData) {
                notFound();
                return;
              }
              setStaff(staffData);
          } catch (error) {
              console.error("Could not fetch staff details:", error);
              notFound();
          } finally {
            setIsLoading(false);
          }
      }
      getStaffData();
    }, [id]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!staff) {
      return notFound();
    }

    const getInitials = (name: string) => {
      return name ? name.split(' ').map(n => n[0]).join('') : '';
    }

    const formatPaymentRate = (staffMember: Staff | null) => {
        if (!staffMember) return "N/A";
        const { paymentType, paymentRate, salary } = staffMember;
        
        if (paymentType && typeof paymentRate === 'number') {
            switch (paymentType) {
                case "salary":
                    return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(paymentRate) + " / month";
                case "commission":
                    return `${paymentRate}%`;
                case "headcount":
                    return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(paymentRate) + " / student";
            }
        }
        
        // Fallback for older records with the 'salary' field
        if (typeof salary === 'number') {
             return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(salary) + " / month (Legacy)";
        }

        return "N/A";
    }
    
    const safeFormatDate = (dateString?: string) => {
        if (!dateString) return "N/A";
        try {
            // Ensure the date string is valid before formatting
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return "Invalid Date";
            }
            return format(date, "PPP");
        } catch (error) {
            console.error("Invalid date format:", dateString, error);
            return "N/A";
        }
    }


    return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
                <Link href="/staff-management/directory">
                    <ArrowLeft />
                    <span className="sr-only">Back</span>
                </Link>
            </Button>
            <h1 className="text-2xl font-bold">Staff Profile</h1>
            </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.push(`/staff-management/directory/${staff.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Button>
            </div>
        </div>
        <Card>
          <CardHeader className="flex flex-row items-start gap-6 space-y-0">
              <Avatar className="h-24 w-24">
                  <AvatarImage src={`https://picsum.photos/seed/${staff.id}/200/200`} data-ai-hint="staff photo" />
                  <AvatarFallback>{getInitials(staff.name || '')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                  <CardTitle className="text-3xl">{staff.name || 'N/A'}</CardTitle>
                  <CardDescription className="text-lg">{staff.email || 'No email provided'}</CardDescription>
                  <div className="mt-4 flex items-center gap-2">
                      <Badge variant={staff.status === 'active' ? 'default' : 'destructive'} className="text-sm capitalize">{staff.status || 'unknown'}</Badge>
                      <Badge variant="secondary" className="capitalize">{staff.role || 'unknown'}</Badge>
                      <Badge variant="outline" className="capitalize">{staff.gender || 'unknown'}</Badge>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Personal & Contact Information</h3>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{staff.phone || 'N/A'}</p>
                           <p className="text-muted-foreground">Alt. Phone</p>
                          <p className="font-medium">{staff.altPhone || 'N/A'}</p>
                           <p className="text-muted-foreground">Date of Birth</p>
                          <p className="font-medium">{safeFormatDate(staff.dateOfBirth)}</p>
                          <p className="text-muted-foreground col-span-2">Address</p>
                          <p className="font-medium col-span-2">{staff.address || 'N/A'}</p>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Employment Information</h3>
                      <Separator />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                          <p className="text-muted-foreground">Staff ID</p>
                          <p className="font-medium">{staff.id || 'N/A'}</p>
                           <p className="text-muted-foreground">Department</p>
                          <p className="font-medium">{staff.department || 'N/A'}</p>
                          <p className="text-muted-foreground">Hire Date</p>
                          <p className="font-medium">{safeFormatDate(staff.hireDate)}</p>
                           <p className="text-muted-foreground">Payment Model</p>
                          <p className="font-medium capitalize">{staff.paymentType || 'Salary (Legacy)'}</p>
                           <p className="text-muted-foreground">Payment Rate</p>
                           <p className="font-medium">{formatPaymentRate(staff)}</p>
                      </div>
                  </div>
                   <div className="md:col-span-2 space-y-4">
                      <h3 className="text-lg font-semibold">Qualifications</h3>
                      <Separator />
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{staff.qualifications || 'N/A'}</p>
                  </div>
              </div>
          </CardContent>
        </Card>
      </div>
    );
}
