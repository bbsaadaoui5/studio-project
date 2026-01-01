
"use client";

import * as React from "react";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  Loader2,
  PlusCircle,
} from "lucide-react";
import { ActionIcons } from "@/components/action-icons";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { type Staff } from "@/lib/types";
import { getStaffMembers } from "@/services/staffService";
import { deleteStaffMember } from "@/services/deleteStaffService";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { debounce } from "@/lib/utils";

export default function StaffDirectoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [staff, setStaff] = React.useState<Staff[]>([]);
  const [roleFilter, setRoleFilter] = React.useState<string>("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 50,
  });

  const fetchStaff = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedStaff = await getStaffMembers();
      console.log(`[StaffDirectory] Fetched ${fetchedStaff.length} staff members`);
      setStaff(fetchedStaff);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("common.couldNotFetchStaff"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  React.useEffect(() => {
    void fetchStaff();
  }, [fetchStaff]);

  // تصفية حسب الدور باستخدام useMemo لتحسين الأداء
  const filteredStaff = React.useMemo(() => {
    return roleFilter ? staff.filter(s => s.role === roleFilter) : staff;
  }, [staff, roleFilter]);

  const columns: ColumnDef<Staff>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="تحديد الكل"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="تحديد الصف"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "معرف الموظف",
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        const role = row.original.role as string;
        const numericId = id.replace(/\D/g, '');
        const shortId = numericId.slice(-3).padStart(3, '0');
        let prefix = "";
        
        if (role === "admin") prefix = "ST";
        else if (role === "teacher" || role === "support") prefix = "TS";
        else prefix = "ST";
        
        return (
          <div className="font-mono text-sm font-semibold">
            {prefix}{shortId}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "الاسم",
      cell: ({ row }) => (
        <Button variant="link" asChild className="p-0">
          <Link href={`/staff-management/directory/${row.original.id}`} className="font-medium">
            {row.getValue("name")}
          </Link>
        </Button>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            البريد الإلكتروني
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const email = row.getValue("email") as string | undefined;
        return <div className="lowercase">{email ? email : 'غير متوفر'}</div>;
      },
    },
    {
      accessorKey: "role",
      header: "الدور",
      cell: ({ row }) => {
        const role = row.getValue("role");
        if (role === "teacher") return "أستاذ أكاديمي";
        if (role === "support") return "أستاذ دعم";
        if (role === "admin") return "إداري";
        return "-";
      },
    },
    {
      accessorKey: "department",
      header: "القسم",
      cell: ({ row }) => <div>{row.getValue("department")}</div>,
    },
    {
      accessorKey: "status",
      header: "الحالة",
      cell: ({ row }) => {
         const status = row.getValue("status") as string;
         const variant = status === "active" ? "default" : "destructive";
         return <Badge variant={variant} className="capitalize">{status === 'active' ? 'نشط' : 'غير نشط'}</Badge>;
      },
    },
     {
      accessorKey: "hireDate",
      header: "تاريخ التوظيف",
      cell: ({ row }) => {
        const hireDate = row.getValue("hireDate") as string | undefined;
        return (
            <div>{hireDate ? new Date(hireDate).toLocaleDateString() : 'غير متوفر'}</div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const staffMember = row.original;
        return (
          <ActionIcons
            onView={() => router.push(`/staff-management/directory/${staffMember.id}`)}
            onEdit={() => router.push(`/staff-management/directory/${staffMember.id}/edit`)}
            onDelete={async () => {
              if (window.confirm("هل أنت متأكد أنك تريد حذف هذا الموظف/الأستاذ؟ لا يمكن التراجع عن هذا الإجراء.")) {
                try {
                  await deleteStaffMember(staffMember.id);
                  setStaff((prev) => prev.filter((s) => s.id !== staffMember.id));
                  toast({
                    title: "تم الحذف",
                    description: "تم حذف الموظف/الأستاذ بنجاح.",
                    variant: "default",
                  });
                } catch (error) {
                  toast({
                    title: "خطأ",
                    description: "حدث خطأ أثناء حذف الموظف/الأستاذ. حاول مرة أخرى.",
                    variant: "destructive",
                  });
                }
              }
            }}
          />
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredStaff,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });
  
  const debouncedSetFilter = React.useMemo(
    () =>
      debounce((value: string) => {
        table.getColumn("name")?.setFilterValue(value);
      }, 300),
    [table]
  );

  if (isLoading) {
    return (
        <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
   <Card>
    <CardHeader className="flex flex-row items-center justify-between">
      <div>
        <CardTitle>دليل الموظفين والأساتذة</CardTitle>
        <CardDescription>تصفح وإدارة جميع الموظفين والأساتذة (الأكاديميين والدعم)</CardDescription>
      </div>
       <Button asChild className="btn-glass-primary btn-click-effect">
        <Link href="/staff-management/directory/new">
          <PlusCircle />
          إضافة موظف/أستاذ جديد
        </Link>
      </Button>
    </CardHeader>
    <CardContent>
      <div className="w-full">
        <div className="flex items-center py-4 gap-4">
          <Input
          placeholder="بحث..."
          onChange={(event) => debouncedSetFilter(event.target.value)}
          className="max-w-sm"
          />
          <select
            className="border rounded px-2 py-1"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">كل الأدوار</option>
            <option value="teacher">أساتذة أكاديميون</option>
            <option value="support">أساتذة دعم</option>
            <option value="admin">إداريون</option>
          </select>
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto btn-glass btn-click-effect">
            الأعمدة <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={(value) =>
                column.toggleVisibility(!!value)
                }
              >
                {column.id}
              </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="rounded-md border">
          <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id}>
                {header.isPlaceholder
                  ? null
                  : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TableHead>
              );
              })}
            </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
              >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                {flexRender(
                  cell.column.columnDef.cell,
                  cell.getContext()
                )}
                </TableCell>
              ))}
              </TableRow>
            ))
            ) : (
            <TableRow>
              <TableCell
              colSpan={columns.length}
              className="h-24 text-center"
              >
              لا توجد نتائج
              </TableCell>
            </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} من {table.getFilteredRowModel().rows.length} صفوف محددة
          </div>
          <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="btn-glass btn-click-effect"
          >
            السابق
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="btn-glass btn-click-effect"
          >
            التالي
          </Button>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
  );
}
