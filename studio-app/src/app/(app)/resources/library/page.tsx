
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getBooks, addBook, checkInBook, checkOutBook } from "@/services/libraryService";
import { getActiveStudents } from "@/services/studentService";
import type { Book, Student } from "@/lib/types";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { add } from "date-fns";
import { debounce } from "@/lib/utils";
import { ActionIcons } from "@/components/action-icons";

export default function LibraryPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewBookDialogOpen, setIsNewBookDialogOpen] = useState(false);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookIsbn, setNewBookIsbn] = useState("");

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedBooks, fetchedStudents] = await Promise.all([
        getBooks(),
        getActiveStudents()
      ]);
      setBooks(fetchedBooks);
      setStudents(fetchedStudents);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: t("resources.libraryManagement.errorFetchingBooks"),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchBooks();
  }, [fetchBooks]);

  const handleAddBook = async () => {
    if (!newBookTitle || !newBookAuthor) {
      toast({
        title: t("common.error"),
        description: t("resources.libraryManagement.enterBookDetails"),
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addBook({
        title: newBookTitle,
        author: newBookAuthor,
        isbn: newBookIsbn,
      });
      toast({
        title: t("resources.libraryManagement.bookAdded"),
        description: t("resources.libraryManagement.bookAddedDesc").replace("{title}", newBookTitle),
      });
      fetchBooks(); // Refresh book list
      setNewBookTitle("");
      setNewBookAuthor("");
      setNewBookIsbn("");
      setIsNewBookDialogOpen(false);
    } catch (error) {
      toast({
        title: t("resources.libraryManagement.error"),
        description: t("resources.libraryManagement.errorAddingBook"),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCheckOut = async () => {
  if (!selectedBook || !selectedStudent) {
    toast({ title: t("resources.libraryManagement.error"), description: t("resources.libraryManagement.enterBookDetails"), variant: "destructive" });
    return;
  }
    
    const originalBooks = [...books];
    const dueDate = add(new Date(), { weeks: 2 }).toISOString();

    // Optimistic UI update
    setBooks(prevBooks => 
        prevBooks.map(b => 
            b.id === selectedBook.id 
                ? { ...b, status: 'loaned', loanedTo: selectedStudent, dueDate } 
                : b
        )
    );
    setIsCheckOutDialogOpen(false);

  try {
    await checkOutBook(selectedBook.id, selectedStudent, dueDate);
  toast({title: t("resources.libraryManagement.checkOut"), description: t("resources.libraryManagement.bookAddedDesc").replace("{title}", selectedBook.title)});
  } catch (error) {
    toast({ title: t("resources.libraryManagement.errorCheckingOut"), description: t("resources.libraryManagement.errorCheckingOut"), variant: "destructive" });
    setBooks(originalBooks); // Rollback on error
  } finally {
    setSelectedBook(null);
    setSelectedStudent("");
  }
  }

  const handleCheckIn = async (bookId: string) => {
    const originalBooks = [...books];
    const bookToCheckIn = books.find(b => b.id === bookId);
    if (!bookToCheckIn) return;

    // Optimistic UI update
    setBooks(prevBooks => 
        prevBooks.map(b => 
            b.id === bookId 
                ? { ...b, status: 'available', loanedTo: undefined, dueDate: undefined } 
                : b
        )
    );

    try {
        await checkInBook(bookId);
        toast({title: t("resources.libraryManagement.bookCheckedIn"), description: "الكتاب متاح الآن"});
    } catch (error) {
        toast({ title: t("resources.libraryManagement.errorCheckingIn"), description: "فشل في إرجاع الكتاب. جاري التراجع.", variant: "destructive" });
        setBooks(originalBooks); // Rollback on error
    }
  }

  const openCheckOutDialog = (book: Book) => {
    setSelectedBook(book);
    setStudentSearchQuery("");
    setIsCheckOutDialogOpen(true);
  }

  const debouncedSetSearchQuery = useMemo(
    () => debounce(setSearchQuery, 300),
    []
  );

  const filteredStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return students;
    
    const query = studentSearchQuery.toLowerCase().trim();
    return students.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.idNumber.toLowerCase().includes(query)
    );
  }, [students, studentSearchQuery]);

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>مكتبة المدرسة</CardTitle>
            <CardDescription>
              إدارة الكتب وإعارتها للطلاب.
            </CardDescription>
          </div>
          <Dialog open={isNewBookDialogOpen} onOpenChange={setIsNewBookDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle />
                إضافة كتاب جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة كتاب جديد</DialogTitle>
                <DialogDescription>
                  أدخل تفاصيل الكتاب لإضافته إلى المكتبة.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    عنوان الكتاب
                  </Label>
                  <Input
                    id="title"
                    value={newBookTitle}
                    onChange={(e) => setNewBookTitle(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="author" className="text-right">
                    المؤلف
                  </Label>
                  <Input
                    id="author"
                    value={newBookAuthor}
                    onChange={(e) => setNewBookAuthor(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isbn" className="text-right">
                    رقم الكتاب (ISBN)
                  </Label>
                  <Input
                    id="isbn"
                    value={newBookIsbn}
                    onChange={(e) => setNewBookIsbn(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddBook} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="animate-spin" />}
                  {isSubmitting ? t("resources.libraryManagement.adding") : t("resources.libraryManagement.addBookButton")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث حسب العنوان أو المؤلف..."
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
                  <TableHead>العنوان</TableHead>
                  <TableHead>المؤلف</TableHead>
                  <TableHead>رقم الكتاب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.length > 0 ? (
                  filteredBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>{book.isbn}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            book.status === "available"
                              ? "secondary"
                              : "destructive"
                          }
                          className="capitalize"
                        >
                          {book.status === "available"
                            ? "متاح"
                            : "معار"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
            <div className="flex gap-2 justify-end">
              {book.status === 'available' ? (
                <Button variant="outline" size="sm" onClick={() => openCheckOutDialog(book)}>إعارة</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => handleCheckIn(book.id)}>{t("resources.libraryManagement.checkIn")}</Button>
              )}
              <ActionIcons
                onDelete={() => {
                  if (window.confirm('هل أنت متأكد أنك تريد حذف هذا الكتاب من النظام؟')) {
                    // منطق الحذف الفعلي يجب أن يضاف هنا
                    alert('تم حذف الكتاب بنجاح (مثال فقط)');
                  }
                }}
              />
            </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      لا توجد كتب.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        {/* Check Out Dialog */}
        <Dialog open={isCheckOutDialogOpen} onOpenChange={setIsCheckOutDialogOpen}>
            <DialogContent>
                 <DialogHeader>
                    <DialogTitle>إعارة كتاب: {selectedBook?.title ?? ""}</DialogTitle>
                    <DialogDescription>
                    ابحث عن الطالب بالاسم أو الرقم التعريفي لإعارة الكتاب إليه.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="student-search">بحث عن الطالب</Label>
                        <div className="relative mt-2">
                            <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="student-search"
                                placeholder="ابحث بالاسم أو الرقم التعريفي..."
                                value={studentSearchQuery}
                                onChange={(e) => setStudentSearchQuery(e.target.value)}
                                className="pr-8"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="student-select">الطالب</Label>
                        <Select onValueChange={setSelectedStudent} value={selectedStudent}>
                            <SelectTrigger id="student-select">
                                <SelectValue placeholder="اختر الطالب..." />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <SelectItem key={student.id} value={student.id}>
                                            {student.name} ({student.idNumber})
                                        </SelectItem>
                                    ))
                                ) : (
                                    <div className="p-2 text-center text-sm text-muted-foreground">
                                        لا توجد نتائج
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
          <Button onClick={handleCheckOut} disabled={!selectedStudent}>
            تأكيد الإعارة
          </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
