
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getFeeStructures, saveFeeStructure, getFeeStructureForGrade, updateFeeStructure } from "@/services/financeService";
import { getSettings } from "@/services/settingsService";
import type { FeeStructure } from "@/lib/types";
import { Loader2, PlusCircle, Landmark, Edit } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const sanitizeDocId = (str: string): string => str.replace(/\//g, '_');

const structureSchema = z.object({
    grade: z.string().min(1, "يرجى اختيار المستوى الدراسي."),
    monthlyAmount: z.coerce.number().positive("يجب أن يكون المبلغ رقمًا موجبًا."),
});
// تعريب رؤوس الجداول
const tableHeaders = {
  grade: "المستوى الدراسي",
  monthlyAmount: "المبلغ الشهري",
  actions: "إجراءات"
};

const editStructureSchema = z.object({
  monthlyAmount: z.coerce.number().positive("يجب أن يكون المبلغ رقمًا موجبًا."),
});


export default function FeeStructuresPage() {
  const { toast } = useToast();
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [academicYear, setAcademicYear] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedStructure, setSelectedStructure] = useState<FeeStructure | null>(null);

  const form = useForm<z.infer<typeof structureSchema>>({
    resolver: zodResolver(structureSchema),
    defaultValues: {
      grade: "",
      monthlyAmount: 0,
    }
  });

   const editForm = useForm<z.infer<typeof editStructureSchema>>({
    resolver: zodResolver(editStructureSchema),
    defaultValues: {
      monthlyAmount: 0,
    },
  });

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedStructures, settings] = await Promise.all([
        getFeeStructures(),
        getSettings()
      ]);
      // Show all structures regardless of academic year to help recover lost data
      setStructures(fetchedStructures);
      setAcademicYear(settings.academicYear);
      if (fetchedStructures.length > 0) {
        console.log('[Fee Structures] Loaded:', {
          total: fetchedStructures.length,
          years: [...new Set(fetchedStructures.map(s => s.academicYear))],
          current: settings.academicYear
        });
      }
    } catch (error) {
      console.error('[Fee Structures Error]', error);
      toast({
        title: "Error",
        description: "Could not fetch fee structures.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  useEffect(() => {
    if (selectedStructure) {
        editForm.reset({
            monthlyAmount: selectedStructure.monthlyAmount
        });
    }
  }, [selectedStructure, editForm]);

  async function onAddSubmit(values: z.infer<typeof structureSchema>) {
    setIsSubmitting(true);
    try {
        const docId = `${sanitizeDocId(values.grade)}-${sanitizeDocId(academicYear)}`;
        const existingStructure = await getFeeStructureForGrade(values.grade, academicYear);

        if(existingStructure) {
            toast({ title: "Structure Exists", description: `A fee structure for Grade ${values.grade} already exists for this year.`, variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        const newStructure: FeeStructure = {
            id: docId,
            grade: values.grade,
            academicYear: academicYear,
            monthlyAmount: values.monthlyAmount
        }
      await saveFeeStructure(newStructure);
      toast({
        title: "Fee Structure Saved",
        description: `The fee structure for Grade ${values.grade} has been saved.`,
      });
      fetchPageData();
      form.reset({ grade: "", monthlyAmount: 0 });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save fee structure.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  async function onEditSubmit(values: z.infer<typeof editStructureSchema>) {
    if (!selectedStructure) return;
    setIsSubmitting(true);
    try {
        await updateFeeStructure(selectedStructure.id, {
            monthlyAmount: values.monthlyAmount
        });
        toast({
            title: "Fee Structure Updated",
            description: `The fee for Grade ${selectedStructure.grade} has been updated.`,
        });
        fetchPageData();
        setIsEditDialogOpen(false);
        setSelectedStructure(null);
    } catch (error) {
        toast({
            title: "Error",
            description: "Failed to update fee structure.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-MA', { style: 'currency', currency: 'MAD' }).format(amount);
  }

  const handleEditClick = (structure: FeeStructure) => {
    setSelectedStructure(structure);
    setIsEditDialogOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Fee Structures</CardTitle>
            <CardDescription>
              Define the monthly tuition fees for each grade for the {academicYear} academic year.
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle />
                Add New Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Fee Structure</DialogTitle>
                <DialogDescription>
                  Define the monthly fee for a grade level.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                   <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select a grade" /></SelectTrigger></FormControl>
                            <SelectContent>{[...Array(12)].map((_, i) => (<SelectItem key={i+1} value={`${i + 1}`}>Grade {i + 1}</SelectItem>))}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Fee Amount</FormLabel>
                        <FormControl><Input type="number" placeholder="e.g., 2500" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="animate-spin" />}
                      {isSubmitting ? "Saving..." : "Save Structure"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
                    <TableHead>Grade</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {structures.length > 0 ? (
                    structures.sort((a,b) => parseInt(a.grade) - parseInt(b.grade)).map((structure) => (
                        <TableRow key={structure.id}>
                            <TableCell className="font-medium">Grade {structure.grade}</TableCell>
                            <TableCell>{structure.academicYear}</TableCell>
                            <TableCell>{formatCurrency(structure.monthlyAmount)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(structure)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            No fee structures defined for this year.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
       <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Fee Structure</DialogTitle>
                    <DialogDescription>
                        Update the monthly fee for Grade {selectedStructure?.grade}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={editForm.control}
                            name="monthlyAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>New Monthly Fee Amount</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 2500" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="animate-spin" />}
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </div>
  );
}
