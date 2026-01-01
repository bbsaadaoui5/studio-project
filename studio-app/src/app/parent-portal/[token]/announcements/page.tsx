"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAnnouncements } from "@/services/announcementService";
import { validateParentAccessToken } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/i18n/translation-provider';
import Link from "next/link";

export default function ParentAnnouncementsPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: "destructive" });
          setIsLoading(false);
          return;
        }

        const student = await getStudent(studentId);
        const all = await getAnnouncements(50);

        const filtered = all.filter((a: any) => {
          // audience filtering: if audience provided, show only parents/both
          if (a.audience && a.audience !== 'both' && a.audience !== 'parents') return false;

          // optional grade/class filters if announcement documents include them
          if (a.grade && student && String(a.grade) !== String(student.grade)) return false;
          if (a.className && student && String(a.className) !== String(student.className)) return false;

          return true;
        });

        setAnnouncements(filtered);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('announcements.fetchError'), variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast, t]);

  return (
    <div className="min-h-screen container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('announcements.title')}</h1>
        <div>
          <Link href={`../${token}/calendar`}>
            <a className="text-sm text-primary underline">{t('nav.calendar')}</a>
          </Link>
        </div>
      </header>

      <main>
        <Card>
          <CardHeader>
            <CardTitle>{t('announcements.latestTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t('common.loading')}</p>
            ) : announcements.length === 0 ? (
              <p className="text-muted-foreground">{t('announcements.noForParents')}</p>
            ) : (
              <div className="space-y-4">
                {announcements.map((a: any) => (
                  <article key={a.id} className="p-4 border rounded-md">
                    <h3 className="font-semibold">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{a.content}</p>
                    <div className="text-xs text-muted-foreground mt-2">{a.createdAt}</div>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
