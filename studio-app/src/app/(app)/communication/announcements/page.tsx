"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n/translation-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { 
  PlusCircle, 
  Archive, 
  Calendar, 
  Eye, 
  Trash2, 
  RefreshCw, 
  AlertCircle,
  Bell,
  Clock,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  addAnnouncement, 
  getAnnouncementsByStatus, 
  deleteAnnouncement,
  republishAnnouncement,
  archiveExpiredAnnouncements,
  activateScheduledAnnouncements,
  updateAnnouncement
} from "@/services/announcementService";
import type { Announcement } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  GlassModal,
  GlassModalContent,
  GlassModalDescription,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalTrigger,
} from "@/components/ui/glass-modal";

export default function AnnouncementsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<"active" | "scheduled" | "archived">("active");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<"all" | "teachers" | "parents" | "both">("all");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");
  const [durationDays, setDurationDays] = useState(2);
  const [publishDate, setPublishDate] = useState(new Date().toISOString().slice(0, 16));
  const [eventDate, setEventDate] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, [activeTab]);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      // Auto-archive expired and activate scheduled before fetching
      await archiveExpiredAnnouncements();
      await activateScheduledAnnouncements();
      
      const data = await getAnnouncementsByStatus(activeTab);
      setAnnouncements(data);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.couldNotFetchData'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: t('common.invalidInput'),
        description: "الرجاء ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateAnnouncement(editingId, {
          title: title.trim(),
          content: content.trim(),
          audience,
          priority,
          durationDays,
          publishDate,
          eventDate: eventDate || undefined,
        });
        toast({
          title: t('common.success'),
          description: "تم تحديث الإعلان بنجاح",
        });
      } else {
        await addAnnouncement({
          title: title.trim(),
          content: content.trim(),
          audience,
          priority,
          durationDays,
          publishDate,
          eventDate: eventDate || undefined,
          expiryDate: "", // Will be calculated in service
          status: "active", // Will be set in service based on publishDate
          createdBy: "admin", // TODO: Get from auth context
        });

        toast({
          title: t('common.success'),
          description: "تم إضافة الإعلان بنجاح",
        });
      }

      // Reset form
      setTitle("");
      setContent("");
      setAudience("all");
      setPriority("normal");
      setTitle("");
      setContent("");
      setAudience("all");
      setPriority("normal");
      setDurationDays(2);
      setPublishDate(new Date().toISOString().slice(0, 16));
      setEventDate("");
      setEditingId(null);
      setIsDialogOpen(false);
      
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.failedToSave'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnouncement(id);
      toast({
        title: t('common.success'),
        description: "تم حذف الإعلان",
      });
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('common.failedToDelete'),
        variant: "destructive",
      });
    }
  };

  const handleRepublish = async (id: string) => {
    try {
      await republishAnnouncement(id, 2);
      toast({
        title: t('common.success'),
        description: "تم إعادة نشر الإعلان",
      });
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "فشل في إعادة النشر",
        variant: "destructive",
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await updateAnnouncement(id, { status: "archived" });
      toast({
        title: t('common.success'),
        description: "تم أرشفة الإعلان",
      });
      fetchAnnouncements();
    } catch (error) {
      toast({
        title: t('common.error'),
        description: "فشل في الأرشفة",
        variant: "destructive",
      });
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "urgent":
        return <Badge variant="destructive" className="mr-2"><AlertCircle className="w-3 h-3 ml-1" />عاجل</Badge>;
      case "important":
        return <Badge variant="default" className="mr-2 bg-orange-500"><Bell className="w-3 h-3 ml-1" />مهم</Badge>;
      default:
        return <Badge variant="secondary" className="mr-2">عادي</Badge>;
    }
  };

  const getAudienceBadge = (audience?: string) => {
    const labels: Record<string, string> = {
      all: "الجميع",
      teachers: "المعلمون",
      parents: "أولياء الأمور",
      both: "المعلمون وأولياء الأمور",
    };
    return <Badge variant="outline" className="mr-2"><Users className="w-3 h-3 ml-1" />{labels[audience || "all"]}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">📢 إدارة الإعلانات</h1>
          <p className="text-muted-foreground mt-1">إدارة الإعلانات مع الأرشفة التلقائية بعد يومين</p>
        </div>
        
        <GlassModal open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <GlassModalTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 ml-2" />
              إعلان جديد
            </Button>
          </GlassModalTrigger>
          <GlassModalContent className="max-w-2xl">
            <GlassModalHeader>
              <GlassModalTitle>{editingId ? "تعديل الإعلان" : "إضافة إعلان جديد"}</GlassModalTitle>
              <GlassModalDescription>
                {editingId ? "تحديث بيانات الإعلان" : "سيتم أرشفة الإعلان تلقائياً بعد انتهاء المدة المحددة"}
              </GlassModalDescription>
            </GlassModalHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <Label htmlFor="title">عنوان الإعلان *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: جدول اجتماع أولياء الأمور"
                  required
                />
              </div>

              <div>
                <Label htmlFor="content">محتوى الإعلان *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب محتوى الإعلان..."
                  rows={4}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="audience">الجمهور المستهدف</Label>
                  <Select value={audience} onValueChange={(value: any) => setAudience(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الجميع</SelectItem>
                      <SelectItem value="teachers">المعلمون فقط</SelectItem>
                      <SelectItem value="parents">أولياء الأمور فقط</SelectItem>
                      <SelectItem value="both">المعلمون وأولياء الأمور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">عادي</SelectItem>
                      <SelectItem value="important">مهم</SelectItem>
                      <SelectItem value="urgent">عاجل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventDate">تاريخ اللقاء / الفعالية</Label>
                  <Input
                    id="eventDate"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    اختياري: يظهر في التقويم ولوحة التحكم
                  </p>
                </div>

                <div>
                  <Label htmlFor="publishDate">تاريخ النشر</Label>
                  <Input
                    id="publishDate"
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    اترك كما هو للنشر الفوري
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">المدة (بالأيام)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="30"
                    value={durationDays}
                    onChange={(e) => setDurationDays(parseInt(e.target.value) || 2)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    سيتم الأرشفة تلقائياً بعد هذه المدة
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "جاري الحفظ..." : editingId ? "تحديث" : "حفظ الإعلان"}
                </Button>
              </div>
            </form>
          </GlassModalContent>
        </GlassModal>
      </div>

      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            <Bell className="w-4 h-4 ml-2" />
            النشطة
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="w-4 h-4 ml-2" />
            المجدولة
          </TabsTrigger>
          <TabsTrigger value="archived">
            <Archive className="w-4 h-4 ml-2" />
            الأرشيف
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">لا توجد إعلانات في هذا القسم</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <Card key={announcement.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getPriorityBadge(announcement.priority)}
                          {getAudienceBadge(announcement.audience)}
                        </div>
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <CardDescription className="mt-2">{announcement.content}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <div className="flex gap-4">
                          {announcement.eventDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              موعد: {format(new Date(announcement.eventDate), "dd MMM yyyy - HH:mm", { locale: ar })}
                            </span>
                          )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(announcement.publishDate), "dd MMM yyyy - HH:mm", { locale: ar })}
                        </span>
                        {announcement.expiryDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            ينتهي: {format(new Date(announcement.expiryDate), "dd MMM yyyy", { locale: ar })}
                          </span>
                        )}
                        {announcement.viewCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {announcement.viewCount} مشاهدة
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {(activeTab === "scheduled" || activeTab === "active") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingId(announcement.id);
                              setTitle(announcement.title);
                              setContent(announcement.content);
                              setAudience(announcement.audience || "all");
                              setPriority(announcement.priority || "normal");
                              setDurationDays(announcement.durationDays);
                              setPublishDate(new Date(announcement.publishDate).toISOString().slice(0, 16));
                              setEventDate(announcement.eventDate ? new Date(announcement.eventDate).toISOString().slice(0, 16) : "");
                              setIsDialogOpen(true);
                            }}
                          >
                            تعديل
                          </Button>
                        )}
                        
                        {activeTab === "archived" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRepublish(announcement.id)}
                          >
                            <RefreshCw className="w-4 h-4 ml-1" />
                            إعادة نشر
                          </Button>
                        )}
                        
                        {activeTab === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(announcement.id)}
                          >
                            <Archive className="w-4 h-4 ml-1" />
                            أرشفة
                          </Button>
                        )}

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                              <AlertDialogDescription>
                                سيتم حذف الإعلان نهائياً ولا يمكن استرجاعه.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex justify-end gap-2">
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                                حذف
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}