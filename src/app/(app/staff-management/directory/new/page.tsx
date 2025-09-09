
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { addStaffMember } from "@/services/staffService";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { getYear, getMonth, getDate } from "date-fns";

const staffSchema = z.object({
  name: z.string().min(3, "Full name must be at least 3 characters."),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
  password: z.string().optional(),
  phone: z.string().min(10, "Please enter a valid phone number."),
  altPhone: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  address: z.string().min(10, "Please enter a valid address."),
  dateOfBirth: z.date({
    required_error: "A date of birth is required.",
  }),
  qualifications: z.string().min(10, "Please enter qualifications."),
  role: z.enum(["teacher", "admin", "support"]),
  department: z.string().min(1, "Please select a department."),
  paymentType: z.enum(["salary", "commission", "headcount"]),
  paymentRate: z.coerce.number().positive("Payment rate must be a positive number."),
}).refine(data => {
    if (data.role === 'teacher' || data.role === 'admin') {
        return !!data.email && !!data.password && data.password.length >= 6;
    }
    return true;
}, {
    message: "Email and a password of at least 6 characters are required for Teachers and Admins.",
    path: ["password"],
});


const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - 18 - i);
const months = [
  { value: 0, label: 'January' }, { value: 1, label: 'February' }, { value: 2, label: 'March' },
  { value: 3, label: 'April' }, { value: 4, label: 'May' }, { value: 5, label: 'June' },
  { value: 6, label: 'July' }, { value: 7, label: 'August' }, { value: 8, label: 'September' },
  { value: 9, label: 'October' }, { value: 10, label: 'November' }, { value: 11, label: 'December' },
];
const days = Array.from({ length: 31 }, (_, i) => i + 1);

export default function NewStaffPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      address: "",
      qualifications: "",
      role: "teacher",
      department: "",
      gender: "male",
      altPhone: "",
      paymentType: "salary",
      paymentRate: 10000,
      dateOfBirth: new Date(),
    },
  });

  const paymentType = form.watch("paymentType");
  const role = form.watch("role");

  const getPaymentRateLabel = () => {
    switch(paymentType) {
        case "salary": return "Monthly Salary";
        case "commission": return "Commission Rate (%)";
        case "headcount": return "Rate Per Student";
        default: return "Payment Rate";
    }
  };

  const onSubmit = async (values: z.infer<typeof staffSchema>) => {
    setIsLoading(true);
    try {
      const newStaff = {
        ...values,
        dateOfBirth: values.dateOfBirth.toISOString(),
      };
      await addStaffMember(newStaff);
      toast({
        title: "Staff Member Added",
        description: `Successfully added ${values.name}. Their account is now active.`,
      });
      router.push("/staff-management/directory");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/staff-management/directory">
            <ArrowLeft />
            <span className="sr-only">Back to Directory</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Add New Staff Member</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Staff Information</CardTitle>
          <CardDescription>
            Fill out the form below to add a new staff member.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Ahmed Bennani" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                         <SelectItem value="teacher">Teacher</SelectItem>
                         <SelectItem value="admin">Admin</SelectItem>
                         <SelectItem value="support">Support Staff</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            
              {(role === 'teacher' || role === 'admin') && (
                <>
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Login Email Address</FormLabel>
                        <FormControl>
                        <Input type="email" placeholder="e.g., ahmed.bennani@example.com" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </>
              )}
                <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +212 600-000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="altPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternative Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +212 600-000001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <div className="grid grid-cols-3 gap-2">
                    <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <Select
                          onValueChange={(val) => {
                            const current = field.value || new Date();
                            const newDate = new Date(current);
                            newDate.setFullYear(parseInt(val));
                            field.onChange(newDate);
                          }}
                          value={field.value ? String(getYear(field.value)) : ''}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger></FormControl>
                          <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                    <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <Select
                          onValueChange={(val) => {
                            const current = field.value || new Date();
                            const newDate = new Date(current);
                            newDate.setMonth(parseInt(val));
                            field.onChange(newDate);
                          }}
                           value={field.value ? String(getMonth(field.value)) : ''}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger></FormControl>
                           <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                     <Controller
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <Select
                          onValueChange={(val) => {
                            const current = field.value || new Date();
                            const newDate = new Date(current);
                            newDate.setDate(parseInt(val));
                            field.onChange(newDate);
                          }}
                          value={field.value ? String(getDate(field.value)) : ''}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger></FormControl>
                          <SelectContent>{days.map(d => <SelectItem key={d} value={String(d)}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <FormMessage>{form.formState.errors.dateOfBirth?.message}</FormMessage>
                </FormItem>
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., 123 Main Street, Rabat, Morocco" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Mathematics">Mathematics</SelectItem>
                        <SelectItem value="English">English</SelectItem>
                        <SelectItem value="Science">Science</SelectItem>
                        <SelectItem value="History">History</SelectItem>
                        <SelectItem value="Arts">Arts</SelectItem>
                        <SelectItem value="Administration">Administration</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                control={form.control}
                name="paymentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                )}
              />
               <FormField
                control={form.control}
                name="paymentRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{getPaymentRateLabel()}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                <FormField
                    control={form.control}
                    name="qualifications"
                    render={({ field }) => (
                    <FormItem className="md:col-span-2">
                        <FormLabel>Qualifications</FormLabel>
                        <FormControl>
                        <Textarea rows={4} placeholder="e.g., Master's in Education, PhD in Physics" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="animate-spin" />}
                  {isLoading ? "Adding..." : "Add Staff Member"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
