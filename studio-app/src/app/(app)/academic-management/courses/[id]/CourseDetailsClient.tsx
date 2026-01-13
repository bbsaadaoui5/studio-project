
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteCourse } from "@/services/courseService";
import { useToast } from "@/hooks/use-toast";
import { Course } from "@/lib/types";

export function CourseDetailsClient({ course }: { course: Course }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCourse(course.id);
      toast({
        title: "متم حذف المقرر",
        description: `تم حذف ${course.name} بنجاح.`,
      });
      router.push("/academic-management/courses");
      router.refresh();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حذف المقرر. يرجى محاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        onClick={() => router.push(`/academic-management/courses/${course.id}/edit`)}
      >
        <Edit className="mr-2 h-4 w-4" />
        تعديل
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            حذف
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              لا يمكن التراجع عن هذا الإجراء. سيؤدي هذا إلى حذف المقرر بشكل دائم
              وجميع بيانات التسجيل والدرجات المرتبطة به..
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "جاري الحذف..." : "متابعة"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
