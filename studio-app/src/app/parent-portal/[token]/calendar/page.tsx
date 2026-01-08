"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { getEvents } from "@/services/eventService";
import { getTimetableForClass } from "@/services/timetableService";
import { getStudent } from "@/services/studentService";
import { validateParentAccessToken } from "@/services/parentService";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useTranslation } from "@/i18n/translation-provider";
import type { SchoolEvent } from "@/lib/types";

export default function ParentCalendarPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const params = useParams();
  const token = params?.token as string | undefined;

  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [examEvents, setExamEvents] = useState<SchoolEvent[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: "destructive" });
          return;
        }

        // events (school-wide)
        const fetchedEvents = await getEvents();
        setEvents(fetchedEvents || []);
        setExamEvents((fetchedEvents || []).filter((e) => e.category === "exam"));

        // timetable for student's class: fetch student record then query timetable for their grade/class
        try {
          const student = await getStudent(studentId);
          if (student && student.grade && student.className) {
            const tt = await getTimetableForClass(student.grade, student.className);
            setTimetable(tt || []);
          } else {
            setTimetable([]);
          }
        } catch (e) {
          console.warn('Failed to load timetable for student', e);
          setTimetable([]);
        }
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error') || 'خطأ', description: t('calendar.fetchError') || 'تعذر تحميل التقويم.', variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast, t]);

  const getEventsForDay = (day: Date) => {
    const formatted = format(day, "yyyy-MM-dd");
    return events.filter((e) => e.date === formatted);
  };

  const parseIso = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const today = useMemo(() => new Date(), []);
  const isSameDay = (d1: Date, d2: Date) => d1.toDateString() === d2.toDateString();

  const todayTomorrowExams = useMemo(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayList: SchoolEvent[] = [];
    const tomorrowList: SchoolEvent[] = [];
    examEvents.forEach((e) => {
      const d = parseIso(e.date);
      if (!d) return;
      if (isSameDay(d, today)) todayList.push(e);
      else if (isSameDay(d, tomorrow)) tomorrowList.push(e);
    });
    return { todayList, tomorrowList };
  }, [examEvents, today]);

  const upcomingExams = useMemo(() => {
    const now = new Date();
    return examEvents
      .map((e) => ({ ...e, d: parseIso(e.date) }))
      .filter((e) => e.d && e.d >= now)
      .sort((a, b) => (a.d && b.d ? a.d.getTime() - b.d.getTime() : 0));
  }, [examEvents]);

  return (
    <div className="min-h-screen">
      <header className="mb-6">
        <div className="container mx-auto">
          <h1 className="text-2xl font-semibold">{t('calendar.pageTitle') || 'التقويم المدرسي'}</h1>
        </div>
      </header>

      <main className="container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('calendar.cardTitle') || 'التقويم والتكامل مع الجدول'}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>{t('loading.checkingLink') || 'جاري التحميل...'}</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Calendar selected={date} onSelect={setDate} />

                  <div className="mt-6 space-y-3">
                    <h3 className="font-semibold">امتحانات اليوم / الغد</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">اليوم</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {todayTomorrowExams.todayList.length === 0 ? (
                            <p className="text-sm text-muted-foreground">لا يوجد امتحان اليوم</p>
                          ) : (
                            todayTomorrowExams.todayList.map((e) => (
                              <div key={e.id} className="p-2 rounded border flex justify-between text-sm">
                                <span>{e.title}</span>
                                <span className="text-muted-foreground">{format(new Date(e.date), 'HH:mm')}</span>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2"><CardTitle className="text-sm">الغد</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                          {todayTomorrowExams.tomorrowList.length === 0 ? (
                            <p className="text-sm text-muted-foreground">لا يوجد امتحان غداً</p>
                          ) : (
                            todayTomorrowExams.tomorrowList.map((e) => (
                              <div key={e.id} className="p-2 rounded border flex justify-between text-sm">
                                <span>{e.title}</span>
                                <span className="text-muted-foreground">{format(new Date(e.date), 'HH:mm')}</span>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">الامتحانات القادمة</h3>
                    {upcomingExams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">لا توجد امتحانات قادمة</p>
                    ) : (
                      <div className="space-y-2">
                        {upcomingExams.map((e) => (
                          <div key={e.id} className="p-3 rounded border flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{e.title}</p>
                              <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'EEEE dd MMM yyyy')}</p>
                            </div>
                            <span className="text-sm text-muted-foreground">{format(new Date(e.date), 'HH:mm')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">{t('calendar.eventsForDay', { date: date ? format(date, 'PPP') : '' })}</h3>
                    <ul className="space-y-2">
                      {getEventsForDay(date || new Date()).length === 0 ? (
                        <li className="text-muted-foreground">{t('calendar.noEventsToday') || 'لا توجد فعاليات لهذا اليوم'}</li>
                      ) : (
                        getEventsForDay(date || new Date()).map(e => (
                          <li key={e.id} className="p-2 border rounded">
                            <p className="font-medium">{e.title}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(e.date), 'dd MMM yyyy')}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold">{t('calendar.weeklyTimetableTitle') || 'الجدول الأسبوعي (مختصر)'}</h4>
                    {timetable.length === 0 ? <p className="text-sm text-muted-foreground">{t('calendar.timetableUnavailable') || 'الجدول غير متوفر هنا — يُعرض في صفحة الجدول الرئيسية.'}</p> : (
                      <div className="space-y-2">
                        {timetable.map((it: any) => (
                          <div key={it.id} className="p-2 border rounded">{it.day} - {it.timeSlot} - {it.courseName}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
