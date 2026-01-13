
"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Edit } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { getStudent } from "@/services/studentService";
import { Student, Course } from "@/lib/types";
import { getCourse } from "@/services/courseService";
import { useTranslation } from "@/i18n/translation-provider";
import { format } from "date-fns";
import { generateParentAccessToken, getParentAccessLink } from "@/services/parentService";
import { useToast } from "@/hooks/use-toast";
import { Copy, Link as LinkIcon } from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const { t } = useTranslation();
  const { toast } = useToast();
  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [supportCourse, setSupportCourse] = useState<(Course & { teacher?: string }) | null>(null);
  const [parentLink, setParentLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  // Effects/hooks first
    useEffect(() => {
      if (!id) return;

      const getStudentData = async () => {
        setIsLoading(true);
        try {
            const studentData = await getStudent(id);
            if (!studentData) {
                notFound();
                return;
            }
            setStudent(studentData);
            // If support program, fetch courses
      if (studentData.studentType === 'support' && studentData.supportCourseIds && studentData.supportCourseIds.length > 0) {
        const coursePromises = studentData.supportCourseIds.map(courseId => getCourse(courseId));
        const coursesData = await Promise.all(coursePromises);
        // Store the first course for backward compatibility
        if (coursesData.length > 0 && coursesData[0]) {
          const course = coursesData[0];
          const teacherName = course.teachers?.[0]?.name || '';
          setSupportCourse({ ...course, teacher: teacherName });
        } else {
          setSupportCourse(null);
        }
            } else {
                setSupportCourse(null);
            }
        } catch (error) {
            console.error("Could not fetch student details:", error);
        } finally {
            setIsLoading(false);
        }
      }

      getStudentData();
    }, [id]);
    
    useEffect(() => {
      if (!id || !student) return;
      const loadLink = async () => {
        try {
          const existingLink = await getParentAccessLink(id);
          setParentLink(existingLink);
        } catch (err) {
          console.error('Failed to load parent link:', err);
        }
      };
      loadLink();
    }, [id, student]);
    
    const handleGenerateParentLink = async () => {
      if (!id || !student) return;
      setIsGeneratingLink(true);
      try {
        const token = await generateParentAccessToken(id, { parentName: student.parentName });
        const link = `${window.location.origin}/parent-portal/${token}`;
        setParentLink(link);
        toast({ title: "✅ تم إنشاء الرابط", description: "تم إنشاء رابط بوابة ولي الأمر بنجاح" });
      } catch (err) {
        console.error('Failed to generate parent link:', err);
        toast({ title: "خطأ", description: "فشل في إنشاء الرابط", variant: "destructive" });
      } finally {
        setIsGeneratingLink(false);
      }
    };
    
    const handleCopyLink = () => {
      if (!parentLink) return;
      navigator.clipboard.writeText(parentLink);
      toast({ title: "✅ تم النسخ", description: "تم نسخ الرابط إلى الحافظة" });
    };

    if (!id) { return <div>ID not found</div>; }

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!student) {
      return notFound();
    }

    const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('');
    }

    return (
      <div className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
      <Button variant="outline" size="icon" onClick={() => router.push('/student-management/directory')} aria-label={t('common.backToDirectory') || 'Back to directory'}>
        <ArrowLeft />
        <span className="sr-only">{t('common.backToDirectory') || 'Back to directory'}</span>
      </Button>
            <h1 className="text-2xl font-bold">{t("students.studentProfile")}</h1>
            </div>
            <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push(`/student-management/directory/${student.id}/edit`)} aria-label={t('students.editStudent')}>
          <Edit className="mr-2 h-4 w-4" />
          {t('students.editStudent')}
        </Button>
            </div>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-start gap-6 space-y-0">
              <Avatar className="h-24 w-24">
                  <AvatarImage src={`https://picsum.photos/seed/${student.id}/200/200`} data-ai-hint="student photo" />
                  <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                  <CardTitle className="text-3xl">{student.name}</CardTitle>
                  <CardDescription className="text-lg">{student.email || 'لا يوجد بريد إلكتروني'}</CardDescription>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className="text-sm capitalize">{student.status === 'active' ? 'نشط' : 'غير نشط'}</Badge>
                      {student.studentType === 'regular' ? (
                        <Badge variant="secondary" className="capitalize">الصف {student.grade} - الفصل {student.className}</Badge>
                      ) : (
                        <Badge variant="secondary" className="capitalize">برنامج دعم</Badge>
                      )}
                      {student.studentType === 'support' && supportCourse && (
                        <>
                          <Badge variant="secondary" className="capitalize">المقرر: {supportCourse.name}</Badge>
                          <Badge variant="secondary" className="capitalize">المعلم: {supportCourse.teacher}</Badge>
                        </>
                      )}
                      <Badge variant="outline" className="capitalize">{student.gender === 'male' ? 'ذكر' : 'أنثى'}</Badge>
                  </div>
              </div>
          </CardHeader>
          <CardContent className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-4">
                      <h3 className="text-lg font-semibold">المعلومات الشخصية</h3>
                      <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">{t("students.studentId")}</p>
              <p className="font-medium font-mono">
                {(() => {
                  const id = student.id;
                  const numericId = id.replace(/\D/g, '');
                  const shortId = numericId.slice(-3).padStart(3, '0');
                  return `ST${shortId}`;
                })()}
              </p>
              <p className="text-muted-foreground">{t("students.dateOfBirth")}</p>
              <p className="font-medium">{student.dateOfBirth ? format(new Date(student.dateOfBirth), "PPP") : t("common.notAvailable")}</p>
              <p className="text-muted-foreground">{t("students.enrollmentDate")}</p>
              <p className="font-medium">{student.enrollmentDate ? format(new Date(student.enrollmentDate), "PPP") : t("common.notAvailable")}</p>
               <p className="text-muted-foreground col-span-2">{t("students.address")}</p>
              <p className="font-medium col-span-2">{student.address}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{t("students.guardianInformation")}</h3>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">{t("students.parentName")}</p>
              <p className="font-medium">{student.parentName}</p>
              <p className="text-muted-foreground">{t("students.guardianPhone")}</p>
              <p className="font-medium">{student.contact}</p>
               <p className="text-muted-foreground">{t("students.altContact")}</p>
              <p className="font-medium">{student.altContact || t("common.notAvailable")}</p>
            </div>
          </div>
           <div className="md:col-span-2 space-y-4">
           <h3 className="text-lg font-semibold">{t("students.medicalNotes")}</h3>
           <Separator />
           <p className="text-sm text-muted-foreground">{student.medicalNotes || t("students.noMedicalNotes")}</p>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold">رابط بوابة ولي الأمر</h3>
            <Separator />
            <div className="flex items-center gap-2">
              {parentLink ? (
                <>
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-sm overflow-x-auto">
                    {parentLink}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                    aria-label="نسخ الرابط"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleGenerateParentLink}
                  disabled={isGeneratingLink}
                  aria-label="إنشاء رابط بوابة ولي الأمر"
                >
                  {isGeneratingLink ? (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4 animate-spin" />
                      جارٍ الإنشاء...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      إنشاء رابط بوابة ولي الأمر
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
              </div>
          </CardContent>
        </Card>
      </div>
    );
}
