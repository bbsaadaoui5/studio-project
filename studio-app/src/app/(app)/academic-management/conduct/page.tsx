"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { Student } from "@/lib/types";
import { getStudents, getStudentsByClass } from "@/services/studentService";
import { addConductNote, getConductNotesForStudent } from "@/services/conductService";
import { Loader2, Plus, CheckCircle2, XCircle, AlertCircle, History } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";

export default function ConductManagementPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [studentsInClass, setStudentsInClass] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [noteType, setNoteType] = useState<"positive" | "negative" | "neutral">("positive");
  const [noteText, setNoteText] = useState<string>("");
  
  // History dialog state
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [historyStudentId, setHistoryStudentId] = useState<string>("");
  const [historyNotes, setHistoryNotes] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const fetchedStudents = await getStudents();
        setAllStudents(fetchedStudents.filter(s => s.status === 'active'));
      } catch (error) {
        toast({
          title: t("common.error"),
          description: "تعذر جلب بيانات الطلاب",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, [toast, t]);

  const grades = useMemo(() => [...new Set(allStudents.map(s => s.grade).filter(Boolean))].sort((a,b) => parseInt(a)-parseInt(b)), [allStudents]);
  
  const classNamesForGrade = useMemo(() => {
    if (!selectedGrade) return [];
    return [...new Set(allStudents.filter(s => s.grade === selectedGrade).map(s => s.className).filter(Boolean))].sort();
  }, [allStudents, selectedGrade]);

  useEffect(() => {
    setSelectedClass("");
  }, [selectedGrade]);

  useEffect(() => {
    const fetchClassStudents = async () => {
      if (!selectedGrade || !selectedClass) {
        setStudentsInClass([]);
        return;
      }
      setIsLoading(true);
      try {
        const students = await getStudentsByClass(selectedGrade, selectedClass);
        const activeStudents = students.filter(s => s.status === 'active');
        setStudentsInClass(activeStudents);
        if (activeStudents.length > 0) {
          setSelectedStudent(activeStudents[0].id);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "تعذر جلب الطلاب لهذا الفصل.",
          variant: "destructive",
        });
        setStudentsInClass([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClassStudents();
  }, [selectedGrade, selectedClass, toast]);

  const handleAddNote = async () => {
    if (!selectedStudent || !noteText.trim()) {
      toast({
        title: t("common.error"),
        description: "يرجى اختيار طالب وإدخال الملاحظة.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: t("common.error"),
        description: "المستخدم غير مسجل الدخول.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await addConductNote({
        studentId: selectedStudent,
        teacherId: user.uid,
        teacherName: user.displayName || user.email || "Unknown Teacher",
        date: new Date().toISOString(),
        note: noteText.trim(),
        type: noteType,
      });

      toast({
        title: t("common.success"),
        description: "تم إضافة ملاحظة السلوك بنجاح.",
      });

      // Reset form
      setNoteText("");
      setNoteType("positive");
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "تعذر إضافة ملاحظة السلوك.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleViewHistory = async (studentId: string) => {
    setHistoryStudentId(studentId);
    setHistoryDialogOpen(true);
    setLoadingHistory(true);
    
    try {
      const notes = await getConductNotesForStudent(studentId);
      setHistoryNotes(notes);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "تعذر تحميل سجل السلوك.",
        variant: "destructive",
      });
      setHistoryNotes([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'negative':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'positive':
        return <Badge className="bg-green-100 text-green-800">إيجابي</Badge>;
      case 'negative':
        return <Badge className="bg-red-100 text-red-800">سلبي</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">محايد</Badge>;
    }
  };

  const selectedStudentData = studentsInClass.find(s => s.id === selectedStudent);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">إدارة السلوك والانضباط</h1>
          <p className="text-muted-foreground mt-1">تسجيل وإدارة ملاحظات السلوك للطلاب</p>
        </div>
      </div>

      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>اختر الصف والفصل</CardTitle>
          <CardDescription>اختر الصف والفصل لعرض الطلاب</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="grade">الصف</Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map(grade => (
                    <SelectItem key={grade} value={grade}>
                      الصف {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="class">الفصل</Label>
              <Select 
                value={selectedClass} 
                onValueChange={setSelectedClass}
                disabled={!selectedGrade}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {classNamesForGrade.map(className => (
                    <SelectItem key={className} value={className}>
                      الفصل {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Conduct Note Form */}
      {selectedGrade && selectedClass && studentsInClass.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>الطلاب ({studentsInClass.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {studentsInClass.map(student => (
                    <div
                      key={student.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                        selectedStudent === student.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted border-transparent'
                      }`}
                      onClick={() => setSelectedStudent(student.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {student.idNumber ? (
                              `رقم الطالب: ${student.idNumber}`
                            ) : (
                              `رقم الطالب: ST${student.id.replace(/\D/g, '').slice(-3).padStart(3, '0')}`
                            )}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewHistory(student.id);
                          }}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Add Note Form */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>إضافة ملاحظة سلوك</CardTitle>
              {selectedStudentData && (
                <CardDescription>
                  الطالب: <span className="font-semibold">{selectedStudentData.name}</span>
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="note-type">نوع الملاحظة</Label>
                <RadioGroup value={noteType} onValueChange={(v: any) => setNoteType(v)} className="flex gap-4 mt-2">
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="positive" id="positive" />
                    <Label htmlFor="positive" className="flex items-center gap-2 cursor-pointer">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      إيجابي
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="neutral" id="neutral" />
                    <Label htmlFor="neutral" className="flex items-center gap-2 cursor-pointer">
                      <AlertCircle className="h-4 w-4 text-gray-600" />
                      محايد
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value="negative" id="negative" />
                    <Label htmlFor="negative" className="flex items-center gap-2 cursor-pointer">
                      <XCircle className="h-4 w-4 text-red-600" />
                      سلبي
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="note-text">الملاحظة</Label>
                <Textarea
                  id="note-text"
                  placeholder="اكتب ملاحظة السلوك هنا..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={6}
                  className="mt-2"
                />
              </div>

              <Button 
                onClick={handleAddNote} 
                disabled={isSaving || !noteText.trim()}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    إضافة ملاحظة
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {(!selectedGrade || !selectedClass) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">اختر الصف والفصل للبدء</p>
          </CardContent>
        </Card>
      )}

      {selectedGrade && selectedClass && studentsInClass.length === 0 && !isLoading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">لا يوجد طلاب في هذا الفصل</p>
          </CardContent>
        </Card>
      )}

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>سجل السلوك</DialogTitle>
            <DialogDescription>
              {studentsInClass.find(s => s.id === historyStudentId)?.name}
            </DialogDescription>
          </DialogHeader>
          
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : historyNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد ملاحظات سلوك لهذا الطالب
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {historyNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      note.type === 'positive'
                        ? 'border-l-green-500 bg-green-50'
                        : note.type === 'negative'
                        ? 'border-l-red-500 bg-red-50'
                        : 'border-l-gray-500 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(note.type)}
                        {getTypeBadge(note.type)}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(note.date), 'PPP', { locale: ar })}
                      </span>
                    </div>
                    <p className="text-sm mb-2">{note.note}</p>
                    <p className="text-xs text-muted-foreground">
                      المعلم: {note.teacherName}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
