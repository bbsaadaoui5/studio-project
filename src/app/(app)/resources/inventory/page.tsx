
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getInventoryItems, addInventoryItem, updateItemStatus } from "@/services/inventoryService";
import type { InventoryItem } from "@/lib/types";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn, debounce } from "@/lib/utils";

const itemSchema = z.object({
    name: z.string().min(3, "Item name is required."),
    category: z.enum(["electronics", "furniture", "lab-equipment", "sports-gear", "other"]),
    location: z.string().min(3, "Location is required."),
    purchaseDate: z.date({
        required_error: "A purchase date is required.",
    }),
});

export default function InventoryPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof itemSchema>>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      location: "",
      category: "electronics",
    }
  });

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedItems = await getInventoryItems();
      setItems(fetchedItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not fetch inventory items.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  async function onSubmit(values: z.infer<typeof itemSchema>) {
    setIsSubmitting(true);
    try {
      await addInventoryItem({
        ...values,
        purchaseDate: values.purchaseDate.toISOString(),
      });
      toast({
        title: "Item Added",
        description: `"${values.name}" has been added to the inventory.`,
      });
      fetchItems();
      form.reset({ name: "", location: "", category: "electronics" });
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const debouncedSetSearchQuery = useMemo(
    () => debounce(setSearchQuery, 300),
    []
  );

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>جرد المدرسة</CardTitle>
            <CardDescription>
              إدارة وتتبع جميع ممتلكات ومعدات المدرسة.
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button aria-label={t('resources.addItem') || 'Add item'}>
                <PlusCircle />
                <span className="sr-only">{t('resources.addItem') || 'Add item'}</span>
                إضافة عنصر جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة عنصر جديد للجرد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل الأصل الجديد لإضافته إلى الجرد.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم العنصر</FormLabel>
                        <FormControl><Input placeholder="مثال: حاسوب محمول Dell" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
            <FormLabel>الفئة</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="اختر الفئة" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="electronics">إلكترونيات</SelectItem>
                <SelectItem value="furniture">أثاث</SelectItem>
                <SelectItem value="lab-equipment">معدات مختبر</SelectItem>
                <SelectItem value="sports-gear">معدات رياضية</SelectItem>
                <SelectItem value="other">أخرى</SelectItem>
              </SelectContent>
            </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>الموقع</FormLabel>
                        <FormControl><Input placeholder="مثال: المكتبة، غرفة 102" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>تاريخ الشراء</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>اختر التاريخ</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("2000-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="animate-spin" />}
                      {isSubmitting ? "...يتم الإضافة" : "إضافة العنصر"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
           <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث حسب الاسم أو الفئة أو الموقع..."
                  onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                  className="w-full rounded-lg bg-background pl-8 md:w-1/3"
                />
              </div>
            </div>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الاسم</TableHead>
                  <TableHead>الفئة</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>تاريخ الشراء</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="capitalize">{item.category.replace("-", " ")}</TableCell>
                      <TableCell>{item.location}</TableCell>
                      <TableCell>{format(new Date(item.purchaseDate), "PPP")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.status === "available" ? "secondary" : item.status === "in-use" ? "default" : "destructive"
                          }
                          className="capitalize"
                        >
                          {item.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      لا يوجد عناصر في الجرد.
                    </TableCell>
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
