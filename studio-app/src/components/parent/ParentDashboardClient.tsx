"use client";

import { useEffect, useState } from "react";

// Firebase auth and service helpers
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { getParent } from "@/services/parentAccountService";
import { getStudent } from "@/services/studentService";
import { getParentAccessLink } from "@/services/parentService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Loader2, Users } from "lucide-react";
import { useTranslation } from "@/i18n/translation-provider";

type LinkedStudent = { id: string; name: string; grade: string; className: string; link: string | null };

export default function ParentDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<LinkedStudent[]>([]);
  const { t } = useTranslation();
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        window.location.href = "/parent/login";
        return;
      }
      const parent = await getParent(user.uid);
      if (!parent) {
        setStudents([]);
        setLoading(false);
        return;
      }
      const results: LinkedStudent[] = [];
      for (const sid of parent.linkedStudentIds || []) {
        const s = await getStudent(sid);
        if (s) {
          const link = await getParentAccessLink(sid);
          results.push({ id: sid, name: s.name, grade: s.grade, className: s.className, link });
        }
      }
      setStudents(results);
      setLoading(false);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users /> {t('auth.yourStudents')}</CardTitle>
          <CardDescription>Open the portal for each linked student.</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground">{t('auth.noStudentsLinked')}</p>
          ) : (
            <div className="space-y-3">
              {students.map((s) => (
                <div key={s.id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-muted-foreground">{t('search.grade')} {s.grade} - {s.className}</div>
                  </div>
                  {s.link ? (
                    <Link href={s.link} target="_blank">
                      <Button variant="outline">Open Portal</Button>
                    </Link>
                  ) : (
                    <Button variant="outline" disabled>No Link</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
