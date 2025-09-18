
"use client";

import { useEffect, useState } from "react";
import { useRouter, notFound, useParams } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { getStaffMember, updateStaffMember } from "@/services/staffService";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Staff } from "@/lib/types";
import { getYear, getMonth, getDate } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

const staffSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(10, "Please enter a valid phone number."),
  altPhone: z.string().optional(),
  gender: z.enum(["male", "female"]),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.date({ required_error: "A date of birth is required." }),
  qualifications: z.string().min(10, "Please enter qualifications."),
  role: z.enum(["teacher", "admin", "support"]),
  department: z.string().min(1, "Please select a department."),
  status: z.enum(["active", "inactive"]),
  paymentType: z.enum(["salary", "commission", "headcount"]).optional(),
  paymentRate: z.coerce.number().positive("Payment rate must be a positive number.").optional(),
});

const years = Array.from({ length: 70 }, (_, i) => new Date().getFullYear() - 18 - i);
const months = [
  { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
  { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
  { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
  { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' },
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function EditStaffPage() {
  const params = useParams();
  const id = params?.id as string;
if (!id) { return <div>ID not found</div>; }
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [staff, setStaff] = useState<Staff | null>(null);

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
  });
  
  const paymentType = form.watch("paymentType");

  const getPaymentRateLabel = () => {
    switch(paymentType) {
        case "salary": return "Monthly Salary";
        case "commission": return "Commission Rate (%)";
        case "headcount": return "Rate Per Student";
        default: return "Payment Rate";
    }
  }

  useEffect(() => {
    if (!id) return;
    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        const fetchedStaff = await getStaffMember(id);
        if (fetchedStaff) {
          setStaff(fetchedStaff);
          form.reset({
            ...fetchedStaff,
            dateOfBirth: new Date(fetchedStaff.dateOfBirth),
            altPhone: fetchedStaff.altPhone || '',
            paymentRate: fetchedStaff.paymentRate || undefined,
            paymentType: fetchedStaff.paymentType || undefined,
          });
        } else {
          notFound();
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch staff data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStaff();
  }, [id, form, toast]);

  async function onSubmit(values: z.infer<typeof staffSchema>) {
    setIsSaving(true);
    try {
      await updateStaffMember(id, {
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
      });
      toast({
        title: "Staff Member Updated",
        description: `Successfully updated ${values.name}'s record.`,
      });
      router.push(`/staff-management/directory/${id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update the staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }
  
  if (isLoading || !staff) {
    return (
        <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/staff-management/directory/${id}`}>
            <div>
              <ArrowLeft />
              <span className="sr-only">Back to Profile</span>
            </div>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Edit Staff Information</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Editing: {staff.name}</CardTitle>
          <CardDescription>
            Update the staff member's information below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Email</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Phone</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="altPhone" render={({ field }) => (<FormItem><FormLabel>Alt. Phone (Optional)</FormLabel><FormControl><Input {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="gender" render={({ field }) => (<FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="status" render={({ field }) => (<FormItem><FormLabel>Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
              
              <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
                <FormItem className="md:col-span-2">
                    <FormLabel>Date of Birth</FormLabel>
                    <div className="grid grid-cols-3 gap-2">
                        <Controller name="dateOfBirth" control={form.control} render={({ field: dobField }) => (
                          <>
                            <Select onValueChange={(val) => {const d = new Date(dobField.value || Date.now()); d.setFullYear(parseInt(val)); dobField.onChange(d);}} value={String(getYear(dobField.value || Date.now()))}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger></FormControl>
                              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                            </Select>
                          </>
                        )}/>
                        <Controller name="dateOfBirth" control={form.control} render={({ field: dobField }) => (
                          <>
                            <Select onValueChange={(val) => {const d = new Date(dobField.value || Date.now()); d.setMonth(parseInt(val)); dobField.onChange(d);}} value={String(getMonth(dobField.value || Date.now()))}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                              <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                            </Select>
                          </>
                        )}/>
                        <Controller name="dateOfBirth" control={form.control} render={({ field: dobField }) => (
                          <>
                            <Select onValueChange={(val) => {const d = new Date(dobField.value || Date.now()); d.setDate(parseInt(val)); dobField.onChange(d);}} value={String(getDate(dobField.value || Date.now()))}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger></FormControl>
                              <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                          </>
                        )}/>
                    </div>
                    <FormMessage />
                </FormItem>
              )}/>
              
              <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Role</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="teacher">Teacher</SelectItem><SelectItem value="admin">Admin</SelectItem><SelectItem value="support">Support</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="department" render={({ field }) => (<FormItem><FormLabel>Department</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Mathematics">Mathematics</SelectItem><SelectItem value="English">English</SelectItem><SelectItem value="Science">Science</SelectItem><SelectItem value="History">History</SelectItem><SelectItem value="Arts">Arts</SelectItem><SelectItem value="Administration">Administration</SelectItem><SelectItem value="Support">Support</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
              <FormField control={form.control} name="paymentType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a payment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="salary">Salary</SelectItem>
                        <SelectItem value="commission">Commission</SelectItem>
                        <SelectItem value="headcount">Per Student (Headcount)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
              )}/>
               <FormField control={form.control} name="paymentRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getPaymentRateLabel()}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10000" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="qualifications" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Qualifications</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)}/>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="animate-spin" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
