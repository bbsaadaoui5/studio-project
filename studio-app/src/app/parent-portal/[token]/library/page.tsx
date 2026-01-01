"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { validateParentAccessToken } from "@/services/parentService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getBooks, getLoansForStudent, checkOutBook } from "@/services/libraryService";
import type { Book, LibraryLoan } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { add } from "date-fns";

export default function ParentLibraryPage() {
  const { t } = useTranslation();
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();

  const [studentId, setStudentId] = useState<string | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<LibraryLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);
  const [search, setSearch] = useState("");

  const fetchData = React.useCallback(async (sid: string) => {
    setIsLoading(true);
    try {
      const [fBooks, fLoans] = await Promise.all([getBooks(), getLoansForStudent(sid)]);
      setBooks(fBooks);
      setLoans(fLoans);
    } catch (err) {
      console.error(err);
      toast({ title: t('common.error'), description: t('library.fetchError') || 'Failed to load library data.', variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const sid = await validateParentAccessToken(token);
        if (!sid) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: "destructive" });
          setIsLoading(false);
          return;
        }
        setStudentId(sid);
        await fetchData(sid);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('library.pageLoadError') || 'Failed to load library page.', variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [token, fetchData, toast, t]);

  const myLoans = useMemo(() => loans.filter(l => !l.returnDate), [loans]);

  const handleRequestLoan = async (book: Book) => {
    if (!studentId) return;
    if (book.status !== 'available') {
      toast({ title: t('library.notAvailableTitle') || 'Not available', description: t('library.notAvailableDesc') || 'This book is not available right now.', variant: "destructive" });
      return;
    }
    setIsRequesting(true);
    const dueDate = add(new Date(), { weeks: 2 }).toISOString();
    // optimistic updates
    const prevBooks = [...books];
    const prevLoans = [...loans];
    setBooks(bs => bs.map(b => b.id === book.id ? { ...b, status: 'loaned', loanedTo: studentId, dueDate } : b));
    const tempLoan: LibraryLoan = { id: `temp-${Date.now()}`, bookId: book.id, studentId, loanDate: new Date().toISOString(), dueDate };
    setLoans(l => [tempLoan, ...l]);

    try {
      await checkOutBook(book.id, studentId, dueDate);
  toast({ title: t('library.requestedTitle') || 'Requested', description: t('library.requestedDesc', { title: book.title, due: new Date(dueDate).toLocaleDateString() }) || `${book.title} loaned - due ${new Date(dueDate).toLocaleDateString()}` });
      // refresh to get real data
      void fetchData(studentId);
    } catch (err) {
      console.error(err);
      toast({ title: "خطأ", description: "فشل في طلب الإعارة.", variant: "destructive" });
      setBooks(prevBooks);
      setLoans(prevLoans);
    } finally {
      setIsRequesting(false);
    }
  };

  const filteredBooks = books.filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('library.title')}</h1>
      </header>

      <main className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('library.loansTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
            ) : myLoans.length === 0 ? (
              <p>{t('library.noLoans')}</p>
            ) : (
              <ul className="space-y-3">
                {myLoans.map(loan => {
                  const book = books.find(b => b.id === loan.bookId);
                  return (
                    <li key={loan.id} className="p-3 border rounded">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{book?.title ?? loan.bookId}</div>
                          <div className="text-sm text-muted-foreground">{book?.author}</div>
                        </div>
                        <div className="text-right">
                          <div>{t('library.loanDateLabel')}: {new Date(loan.loanDate).toLocaleDateString()}</div>
                          <div>{t('library.dueLabel')}: {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString() : '-'}</div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('library.catalogTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <input placeholder={t('common.search')} className="w-full p-2 border rounded" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
            ) : (
              <ul className="space-y-3">
                {filteredBooks.map(book => (
                  <li key={book.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-medium">{book.title}</div>
                      <div className="text-sm text-muted-foreground">{book.author}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm">{book.status === 'available' ? t('library.available') : t('library.loaned')}</div>
                      <Button size="sm" disabled={book.status !== 'available' || isRequesting} onClick={() => void handleRequestLoan(book)}>
                        {isRequesting ? t('library.requesting') : t('library.request')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
