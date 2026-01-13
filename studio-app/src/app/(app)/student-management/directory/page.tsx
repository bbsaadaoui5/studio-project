
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
import { type Student } from "@/lib/types";
import { getStudents } from "@/services/studentService";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { debounce } from "@/lib/utils";

export default function StudentDirectoryPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

   const fetchStudents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedStudents = await getStudents();
      setStudents(fetchedStudents);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("students.errorFetchingStudents"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  React.useEffect(() => {
    void fetchStudents();
  }, [fetchStudents]);

  const columns: ColumnDef<Student>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "معرف الطالب",
      cell: ({ row }) => {
        const id = row.getValue("id") as string;
        const numericId = id.replace(/\D/g, '');
        const shortId = numericId.slice(-3).padStart(3, '0');
        return (
          <div className="font-mono text-sm font-semibold">
            ST{shortId}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
  header: t("common.name"),
      cell: ({ row }) => (
        <Button variant="link" asChild className="p-0">
          <Link href={`/student-management/directory/${row.original.id}`} className="font-medium">
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
            {t("common.email")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
      {
      accessorKey: "grade",
  header: t("students.grade"),
      cell: ({ row }) => {
        const student = row.original;
        return (
            <div>{student.studentType === 'regular' ? `${t('students.grade')} ${student.grade}` : t('students.supportProgram')}</div>
        )
      },
    },
    {
      accessorKey: "className",
  header: t("students.className"),
      cell: ({ row }) => <div>{row.original.className}</div>,
    },
    {
      accessorKey: "status",
  header: t("common.status"),
      cell: ({ row }) => {
         const status = row.getValue("status") as string;
         const variant = status === "active" ? "default" : "destructive";
         return <Badge variant={variant} className="capitalize">{status}</Badge>;
      },
    },
     {
      accessorKey: "enrollmentDate",
  header: t("common.date"),
      cell: ({ row }) => (
        <div>{new Date(row.getValue("enrollmentDate")).toLocaleDateString()}</div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original;
        return (
          <ActionIcons
            onView={() => router.push(`/student-management/directory/${student.id}`)}
            onEdit={() => router.push(`/student-management/directory/${student.id}/edit`)}
            onDelete={() => {/* تنفيذ حذف الطالب هنا */}}
          />
        );
      },
    },
  ];

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
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
                <CardTitle>{t("students.directory")}</CardTitle>
                <CardDescription>{t('students.browseAndManage')}</CardDescription>
            </div>
             <Button asChild className="btn-glass-primary btn-click-effect">
                <Link href="/student-management/directory/new">
                    <PlusCircle />
                    {t("students.addNew")}
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
            <div className="w-full">
                <div className="flex items-center py-4">
                    <Input
                    placeholder={t("common.search") + "..."}
                    onChange={(event) => debouncedSetFilter(event.target.value)}
                    className="max-w-sm"
                    />
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto btn-glass btn-click-effect">
                        {t('common.columns')} <ChevronDown className="ml-2 h-4 w-4" />
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
                                {(() => {
                                  switch (column.id) {
                                    case 'name': return t('common.name');
                                    case 'email': return t('common.email');
                                    case 'grade': return t('students.grade');
                                    case 'className': return t('students.className');
                                    case 'status': return t('common.status');
                                    case 'enrollmentDate': return t('students.enrollmentDate');
                                    default: return column.id;
                                  }
                                })()}
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
                            {t('common.noResultsFound')}
                            </TableCell>
                        </TableRow>
                        )}
                    </TableBody>
                    </Table>
                </div>
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="flex-1 text-sm text-muted-foreground">
                    {table.getFilteredSelectedRowModel().rows.length} {t('common.of')} {table.getFilteredRowModel().rows.length} {t('common.rowsSelected')}.
                    </div>
                    <div className="space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="btn-glass btn-click-effect"
                    >
                        {t('common.previous')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="btn-glass btn-click-effect"
                    >
                        {t('common.next')}
                    </Button>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
