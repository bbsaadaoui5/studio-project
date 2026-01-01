
"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { useTranslation } from "@/i18n/translation-provider";
import { getFeeStructures, saveFeeStructure, getFeeStructureForGrade, updateFeeStructure } from "@/services/financeService";
import { getSettings } from "@/services/settingsService";
import type { FeeStructure } from "@/lib/types";
import { Loader2, PlusCircle, Edit } from "lucide-react";
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
const grades = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export function FeeStructuresSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const structureSchema = z.object({
    grade: z.string().min(1, t('settings.feeStructures.pleaseSelectGrade')),
    monthlyAmount: z.coerce.number().min(1, t('settings.feeStructures.monthlyAmountRequired')),
  });

  const editStructureSchema = z.object({
    monthlyAmount: z.coerce.number().positive(t('settings.feeStructures.amountMustBePositive')),
  });
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
      setStructures(fetchedStructures.filter(s => s.academicYear === settings.academicYear));
      setAcademicYear(settings.academicYear);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.feeStructures.couldNotFetchStructures'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchPageData();
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
            toast({ title: t('settings.feeStructures.structureExists'), description: t('settings.feeStructures.structureExistsMessage').replace('{grade}', values.grade), variant: "destructive" });
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
        title: t('settings.feeStructures.feeStructureSaved'),
        description: t('settings.feeStructures.feeStructureSavedMessage').replace('{grade}', values.grade),
      });
      fetchPageData();
      form.reset({ grade: "", monthlyAmount: 0 });
      setIsAddDialogOpen(false);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.feeStructures.errorSavingStructure'),
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
            title: t('settings.feeStructures.feeStructureUpdated'),
            description: t('settings.feeStructures.feeUpdatedMessage', { grade: selectedStructure.grade }),
        });
        fetchPageData();
        setIsEditDialogOpen(false);
        setSelectedStructure(null);
    } catch (error) {
        toast({
            title: t('common.error'),
            description: t('settings.feeStructures.errorUpdatingStructure'),
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
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-right">{t('settings.feeStructures.title')}</CardTitle>
            <CardDescription className="text-right">
              {t('settings.feeStructures.academicYearDescription', { academicYear })}
            </CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-right">
                <PlusCircle />
                {t('settings.feeStructures.addNewStructure')}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-right">{t('settings.feeStructures.addFeeStructure')}</DialogTitle>
                <DialogDescription className="text-right">
                  {t('settings.feeStructures.defineMonthlyFee')}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 py-4">
                   <FormField
                    control={form.control}
                    name="grade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">{t('settings.feeStructures.grade')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="text-right"><SelectValue placeholder={t('settings.feeStructures.selectGrade')} /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Kindergarten">Kindergarten</SelectItem>
                              <SelectItem value="Pre-K">Pre-K</SelectItem>
                              <SelectItem value="KG1">KG1</SelectItem>
                              <SelectItem value="KG2">KG2</SelectItem>
                              {[...Array(12)].map((_, i) => (<SelectItem key={i+1} value={`${i + 1}`}>Grade {i + 1}</SelectItem>))}
                            </SelectContent>
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
                        <FormLabel className="text-right">{t('settings.feeStructures.monthlyFeeAmount')}</FormLabel>
                        <FormControl><Input type="number" placeholder={t('settings.feeStructures.exampleAmount')} className="text-right" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSubmitting} className="text-right">
                      {isSubmitting && <Loader2 className="animate-spin" />}
                      {isSubmitting ? t('common.saving') : t('settings.feeStructures.saveStructure')}
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
                    <TableHead className="text-right">{t('settings.feeStructures.grade')}</TableHead>
                    <TableHead className="text-right">{t('settings.feeStructures.academicYear')}</TableHead>
                    <TableHead className="text-right">{t('settings.feeStructures.monthlyFee')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {structures.length > 0 ? (
                    structures.sort((a,b) => parseInt(a.grade) - parseInt(b.grade)).map((structure) => (
                        <TableRow key={structure.id}>
                            <TableCell className="font-medium text-right">{t('common.grade')} {structure.grade}</TableCell>
                            <TableCell className="text-right">{structure.academicYear}</TableCell>
                            <TableCell className="text-right">{formatCurrency(structure.monthlyAmount)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(structure)} className="text-right">
                                    <Edit className="ml-2 h-4 w-4" /> {t('common.edit')}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                            {t('settings.feeStructures.noStructuresForYear')}
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
          )}
        </CardContent>
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-right">{t('settings.feeStructures.editFeeStructure')}</DialogTitle>
                    <DialogDescription className="text-right">
                        {t('settings.feeStructures.updateMonthlyFee', { grade: selectedStructure?.grade })}
                    </DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                    <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={editForm.control}
                            name="monthlyAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-right">{t('settings.feeStructures.newMonthlyFeeAmount')}</FormLabel>
                                    <FormControl><Input type="number" placeholder={t('settings.feeStructures.exampleAmount')} className="text-right" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={isSubmitting} className="text-right">
                                {isSubmitting && <Loader2 className="animate-spin" />}
                                {isSubmitting ? t('common.saving') : t('settings.feeStructures.saveChanges')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
