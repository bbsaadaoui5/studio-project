
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getAdmissionApplications, addAdmissionApplication, updateApplicationStatus, NewApplication } from "@/services/admissionsService";
import { addStudent } from "@/services/studentService";
import type { AdmissionApplication } from "@/lib/types";
import { Loader2, PlusCircle, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  GlassModal,
  GlassModalContent,
  GlassModalDescription,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalTrigger,
} from "@/components/ui/glass-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";


const applicationSchema = z.object({
    applicantName: z.string().min(3, "Applicant name is required."),
    applicantEmail: z.string().email("A valid email is required."),
    gradeApplyingFor: z.string().min(1, "Please select a grade."),
    parentName: z.string().min(3, "Parent name is required."),
    parentContact: z.string().min(10, "A valid contact number is required."),
    previousSchool: z.string().optional(),
});

export default function AdmissionsPage() {
    const { toast } = useToast();
    const [applications, setApplications] = useState<AdmissionApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<z.infer<typeof applicationSchema>>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            applicantName: "",
            applicantEmail: "",
            gradeApplyingFor: "",
            parentName: "",
            parentContact: "",
            previousSchool: "",
        },
    });

    const fetchApplications = useCallback(async () => {
        setIsLoading(true);
        try {
            const fetchedApplications = await getAdmissionApplications();
            setApplications(fetchedApplications);
        } catch (error) {
            toast({ title: "Error", description: "Could not fetch admission applications.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        void fetchApplications();
    }, [fetchApplications]);
    
    async function onSubmit(values: z.infer<typeof applicationSchema>) {
        setIsSubmitting(true);
        try {
            await addAdmissionApplication(values);
            toast({ title: "Application Submitted", description: "The new application has been recorded." });
            fetchApplications();
            form.reset();
            setIsDialogOpen(false);
        } catch (error) {
             toast({ title: "Error", description: "Failed to submit application.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    }
    
    const handleStatusUpdate = async (applicationId: string, newStatus: 'approved' | 'rejected') => {
        setIsUpdating(true);
        const originalApplications = [...applications];
        setApplications(prev => 
            prev.map(app => 
                app.id === applicationId ? { ...app, status: newStatus } : app
            )
        );

        try {
            await updateApplicationStatus(applicationId, newStatus);
            
            if (newStatus === 'approved') {
                const app = originalApplications.find(a => a.id === applicationId);
                if (app) {
                    await addStudent({
                        name: app.applicantName,
                        email: app.applicantEmail,
                        grade: app.gradeApplyingFor,
                        className: 'A', // Defaulting to 'A', can be changed later
                        parentName: app.parentName,
                        contact: app.parentContact,
                        address: app.address || "N/A", // Provide default value
                        dateOfBirth: app.dateOfBirth || new Date().toISOString(), // Provide default value
                        gender: "male", // Default gender, can be updated later
                        studentType: "regular"
                    });
                    toast({ title: "Application Approved", description: `${app.applicantName} has been enrolled as a student.` });
                }
            } else {
                toast({ title: "Status Updated", description: `Application status changed to ${newStatus}.` });
            }
        } catch (error) {
            console.error("Error updating application status:", error);
            toast({ title: "Error", description: "Failed to update application status.", variant: "destructive" });
            setApplications(originalApplications); // Revert UI on failure
        } finally {
            setIsUpdating(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>طلبات الالتحاق و القبول</CardTitle>
                        <CardDescription>
                            مراجعة وإدارة طلبات قبول الطلاب الجدد.
                        </CardDescription>
                    </div>
                    <GlassModal open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <GlassModalTrigger asChild>
                                <Button className="btn-gradient">
                                    <PlusCircle />
                                    إضافة طلب قبول
                                </Button>
                        </GlassModalTrigger>
                        <GlassModalContent>
                            <GlassModalHeader>
                                <GlassModalTitle>إضافة طلب قبول جديد</GlassModalTitle>
                                <GlassModalDescription>
                                    أدخل بيانات المتقدم الجديد.
                                </GlassModalDescription>
                            </GlassModalHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
                                     <FormField
                                        control={form.control}
                                        name="applicantName"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>الاسم الكامل للمتقدم</FormLabel>
                                            <FormControl>
                                                <Input className="glass-input" placeholder="مثال: ليلى بناني" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="applicantEmail"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>البريد الإلكتروني للمتقدم</FormLabel>
                                            <FormControl>
                                                <Input className="glass-input" type="email" placeholder="مثال: layla.b@example.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="gradeApplyingFor"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>الصف المطلوب</FormLabel>
                                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="اختر الصف" /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>{[...Array(12)].map((_, i) => (<SelectItem key={i+1} value={`${i + 1}`}>الصف {i + 1}</SelectItem>))}</SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="parentName"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>اسم ولي الأمر</FormLabel>
                                            <FormControl>
                                                <Input className="glass-input" placeholder="مثال: عمر بناني" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="parentContact"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>هاتف ولي الأمر</FormLabel>
                                            <FormControl>
                                                <Input className="glass-input" placeholder="مثال: +212 600-000000" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={form.control}
                                        name="previousSchool"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>المدرسة السابقة (اختياري)</FormLabel>
                                            <FormControl>
                                                <Input className="glass-input" placeholder="مثال: ثانوية الخوارزمي" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end pt-4">
                                        <Button type="submit" disabled={isSubmitting} className="btn-gradient">
                                            {isSubmitting && <Loader2 className="animate-spin" />}
                                            {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </GlassModalContent>
                    </GlassModal>
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
                                    <TableHead>اسم المتقدم</TableHead>
                                    <TableHead>الصف</TableHead>
                                    <TableHead>ولي الأمر</TableHead>
                                    <TableHead>تاريخ التقديم</TableHead>
                                    <TableHead>الحالة</TableHead>
                                    <TableHead className="text-right">الإجراءات</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.length > 0 ? (
                                    applications.map(app => (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-medium">{app.applicantName}</TableCell>
                                            <TableCell>الصف {app.gradeApplyingFor}</TableCell>
                                            <TableCell>{app.parentName}</TableCell>
                                            <TableCell>{format(new Date(app.applicationDate), 'PPP')}</TableCell>
                                            <TableCell>
                                                <Badge 
                                                    variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}
                                                    className="capitalize"
                                                >
                                                    {app.status === 'approved' ? 'مقبول' : app.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {app.status === 'pending' && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(app.id, 'approved')} disabled={isUpdating}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                            قبول
                                                        </Button>
                                                         <Button variant="outline" size="sm" onClick={() => handleStatusUpdate(app.id, 'rejected')} disabled={isUpdating}>
                                                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                                                            رفض
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">لا توجد طلبات قبول.</TableCell>
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
