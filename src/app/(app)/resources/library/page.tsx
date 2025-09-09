
"use client";

import { useEffect, useState, useMemo } from "react";
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
import { getBooks, addBook, checkInBook, checkOutBook } from "@/services/libraryService";
import { getActiveStudents } from "@/services/studentService";
import type { Book, Student } from "@/lib/types";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { add } from "date-fns";
import { debounce } from "@/lib/utils";

export default function LibraryPage() {
  const { toast } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewBookDialogOpen, setIsNewBookDialogOpen] = useState(false);
  const [isCheckOutDialogOpen, setIsCheckOutDialogOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookIsbn, setNewBookIsbn] = useState("");

  const fetchBooks = async () => {
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
        title: "Error",
        description: "Could not fetch library data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [toast]);

  const handleAddBook = async () => {
    if (!newBookTitle || !newBookAuthor) {
      toast({
        title: "Missing Information",
        description: "Please enter a title and author.",
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
        title: "Book Added",
        description: `"${newBookTitle}" has been added to the library.`,
      });
      fetchBooks(); // Refresh book list
      setNewBookTitle("");
      setNewBookAuthor("");
      setNewBookIsbn("");
      setIsNewBookDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add book.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCheckOut = async () => {
    if (!selectedBook || !selectedStudent) {
        toast({ title: "Error", description: "A book and student must be selected.", variant: "destructive" });
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
        toast({title: "Book Checked Out", description: "The book has been loaned."});
    } catch (error) {
        toast({ title: "Error Checking Out", description: "Failed to check out book. Reverting.", variant: "destructive" });
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
        toast({title: "Book Checked In", description: "The book is now available."});
    } catch (error) {
        toast({ title: "Error Checking In", description: "Failed to check in book. Reverting.", variant: "destructive" });
        setBooks(originalBooks); // Rollback on error
    }
  }

  const openCheckOutDialog = (book: Book) => {
    setSelectedBook(book);
    setIsCheckOutDialogOpen(true);
  }

  const debouncedSetSearchQuery = useMemo(
    () => debounce(setSearchQuery, 300),
    []
  );

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Library Catalog</CardTitle>
            <CardDescription>
              Browse, add, and manage your school's library books.
            </CardDescription>
          </div>
          <Dialog open={isNewBookDialogOpen} onOpenChange={setIsNewBookDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle />
                Add New Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a New Book</DialogTitle>
                <DialogDescription>
                  Enter the details of the new book to add it to the catalog.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
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
                    Author
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
                    ISBN
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
                  {isSubmitting ? "Adding..." : "Add Book"}
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
                  placeholder="Filter by title or author..."
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
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                          {book.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {book.status === 'available' ? (
                            <Button variant="outline" size="sm" onClick={() => openCheckOutDialog(book)}>Check Out</Button>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => handleCheckIn(book.id)}>Check In</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No books found.
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
                    <DialogTitle>Check Out: {selectedBook?.title}</DialogTitle>
                    <DialogDescription>
                    Select the student who is borrowing this book. The due date will be set to two weeks from today.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="student-select">Student</Label>
                    <Select onValueChange={setSelectedStudent} value={selectedStudent}>
                        <SelectTrigger id="student-select">
                            <SelectValue placeholder="Select a student..." />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map(student => (
                                <SelectItem key={student.id} value={student.id}>
                                    {student.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleCheckOut} disabled={!selectedStudent}>
                        Confirm Check Out
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
