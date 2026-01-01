"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAnnouncements } from "@/services/announcementService";
import { getTimetableForClass } from "@/services/timetableService";
import { getCoursesForStudent } from "@/services/enrollmentService";
import { getCourse } from "@/services/courseService";
import { getStudentGradeForCourse } from "@/services/gradeService";
import { getAssignmentsForCourse } from "@/services/gradeService";
import { getAttendanceForStudent } from "@/services/attendanceService";
import { getConversations, getMessages } from "@/services/messageService";
import { getSupportCourses } from "@/services/courseService";
import { useTranslation } from "@/i18n/translation-provider";

type Props = {
  student: any;
  announcements?: any[];
  attendance?: any[];
  timetable?: any[];
  enrolledCourses?: any[];
  supportCourses?: any[];
};

export default function PrototypePortal({ student, announcements = [], attendance = [], timetable = [], enrolledCourses = [], supportCourses = [] }: Props) {
  const { t } = useTranslation();
  const [liveAnnouncements, setLiveAnnouncements] = useState<any[] | null>(null);
  const [liveTimetable, setLiveTimetable] = useState<any[] | null>(null);
  const [liveCourses, setLiveCourses] = useState<any[] | null>(null);
  const [liveAssignments, setLiveAssignments] = useState<any[] | null>(null);
  const [liveAttendance, setLiveAttendance] = useState<any[] | null>(null);
  const [liveMessages, setLiveMessages] = useState<any[] | null>(null);
  const [liveTeachers, setLiveTeachers] = useState<any[] | null>(null);

  const fallback = (arr: any[] | null, propArr: any[] | undefined) => (arr && arr.length > 0 ? arr : (propArr || []));

  const getInitials = (name: string) => {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('');
  }

  const initials = getInitials(student?.name || '');
  const [timetableCompact, setTimetableCompact] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadAll() {
      if (!student) return;
      try {
        const [anns, tt] = await Promise.all([
          getAnnouncements(5).catch(() => []),
          getTimetableForClass(student.grade, student.className).catch(() => []),
        ]);
        if (!mounted) return;
        const annsFiltered = (anns || []).filter((a: any) => {
          const combined = `${a.title || ''} ${a.content || ''}`;
          return !(/[A-Za-z]/.test(combined));
        });
        setLiveAnnouncements(annsFiltered);
        setLiveTimetable(tt || []);
      } catch (e) {
        console.warn('PrototypePortal: failed to load announcements/timetable', e);
      }

      try {
        const courseIds = await getCoursesForStudent(student.id).catch(() => []);
        const coursePromises = courseIds.map(async (id: string) => {
          const c = await getCourse(id).catch(() => null);
          const grade = await getStudentGradeForCourse(id, student.id).catch(() => null);
          return c ? { ...c, finalGrade: grade } : null;
        });
        const courses = (await Promise.all(coursePromises)).filter(Boolean) as any[];
        if (mounted) setLiveCourses(courses);

        const assignmentPromises = courseIds.map(id => getAssignmentsForCourse(id).catch(() => []));
        const assignmentResults = (await Promise.all(assignmentPromises)).flat();
        if (mounted) setLiveAssignments(assignmentResults || []);
      } catch (e) {
        console.warn('PrototypePortal: failed to load courses/assignments', e);
      }

      try {
        const att = await getAttendanceForStudent(student.id).catch(() => []);
        if (mounted) setLiveAttendance(att || []);
      } catch (e) { console.warn(e); }

      try {
        const convos = await getConversations(student.id).catch(() => []);
        if (convos && convos.length > 0) {
          const msgs = await getMessages(convos[0].id).catch(() => []);
          if (mounted) setLiveMessages(msgs || []);
        } else {
          setLiveMessages([]);
        }
      } catch (e) { console.warn('messages', e); setLiveMessages([]); }

      try {
        const support = await getSupportCourses().catch(() => []);
        if (mounted) setLiveTeachers((support && support.length > 0) ? support.map((c: any) => ({ name: c.teachers?.[0]?.name || 'مدرس', subject: c.name, contact: '' })) : null);
      } catch (e) { console.warn(e); }
    }
    void loadAll();
    return () => { mounted = false; };
  }, [student]);

  const normalizeSlot = (s: string) => (s || '').replace(/\s+/g, '').toLowerCase();
  const dayKeyMap: Record<string, string> = { 'الاثنين': 'Monday', 'الثلاثاء': 'Tuesday', 'الأربعاء': 'Wednesday', 'الخميس': 'Thursday', 'الجمعة': 'Friday' };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: '#f5f7fb' }}>
      <header style={{ background: 'linear-gradient(90deg,#6d28d9,#7c3aed)', color: '#fff' }} className="py-6">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div style={{ width: 64, height: 64, background: '#fff1', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{initials}</div>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{student?.name}</div>
              <div style={{ opacity: 0.9, fontSize: 13 }}>الصف {student?.grade} — الفصل {student?.className}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input id="search" placeholder="ابحث عن واجب، رسالة، حدث..." className="px-3 py-2 rounded-md" style={{ minWidth: 240 }} />
            <button id="print-report" className="btn">طباعة</button>
            <button id="toggle-theme" className="btn">🌙</button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <aside className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الإعلانات</CardTitle>
                <CardDescription>أحدث الإشعارات</CardDescription>
              </CardHeader>
              <CardContent>
                {fallback(liveAnnouncements, announcements).length > 0 ? (
                  fallback(liveAnnouncements, announcements).slice(0, 5).map((a: any) => (
                    <article key={a.id || a.title} className="p-3 border-b" style={{ borderColor: '#eef2f7' }}>
                      <div style={{ fontWeight: 700 }}>{a.title}</div>
                      <div style={{ fontSize: 13, opacity: 0.8 }}>{a.content}</div>
                    </article>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد إعلانات حالياً</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>رسائل</CardTitle>
              </CardHeader>
              <CardContent id="messages-list">
                {liveMessages && liveMessages.length > 0 ? (
                  liveMessages.map((m: any) => (
                    <div key={m.id} style={{ padding: 8, borderBottom: '1px dashed #eef2f7' }}>
                      <strong>{m.senderId || m.from}</strong>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>{m.text || m.snippet}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">لا توجد رسائل.</p>
                )}
              </CardContent>
            </Card>
          </aside>

          <section className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>الحضور</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{fallback(liveAttendance, attendance).filter((a: any) => a.status === 'present').length || 0} حضور</div>
              </div>
              <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>الدرجات</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{enrolledCourses?.length || 0} مواد</div>
              </div>
              <div style={{ background: '#fff', padding: 12, borderRadius: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>الواجبات</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>3 عناصر</div>
              </div>
            </div>

            <Card>
              <CardHeader className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle>الجدول الأسبوعي</CardTitle>
                </div>
                <div className="timetable-controls">
                  <div className="timetable-legend">
                    <div className="swatch" style={{background:'#7c3aed'}}></div>
                    <div>مادة — مدرس — قاعة</div>
                  </div>
                  <button className="btn-compact" onClick={() => setTimetableCompact(c => !c)}>{timetableCompact ? 'الوضع العادي' : 'وضع مضغوط'}</button>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`rounded-lg overflow-hidden border parent-timetable ${timetableCompact ? 'compact' : ''}`}>
                  <div className="w-full overflow-auto">
                    <div style={{display:'grid', gridTemplateColumns:'140px repeat(5, minmax(0,1fr))'}} className="text-sm">
                      <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-medium">الوقت</div>
                      {['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'].map(d=> (
                        <div key={d} className="p-3 text-center bg-indigo-50 font-medium">{d}</div>
                      ))}

                      {[
                        '08:00 - 09:00',
                        '09:00 - 10:00',
                        '10:00 - 11:00',
                        '11:00 - 12:00',
                        '13:00 - 14:00',
                        '14:00 - 15:00',
                        '15:00 - 16:00',
                      ].map((ts, idx)=> (
                        <div key={ts} className="contents">
                          <div className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} p-3 font-mono text-xs`}>{ts}</div>
                          {['الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة'].map(d=>{
                            const entries = fallback(liveTimetable, timetable) || [];
                            const key = dayKeyMap[d] || d;
                            const entry = entries.find((e:any)=> { const daysMatch = (e.day === key || e.day === d); const slotsMatch = normalizeSlot(e.timeSlot) === normalizeSlot(ts); return daysMatch && slotsMatch; });
                            return (
                              <div key={`${d}-${ts}`} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'} p-3`}> 
                                {entry ? (
                                  <div className="flex flex-col items-start gap-1 p-3 rounded-lg shadow-sm bg-white border-l-4 border-purple-400">
                                    <div className="font-semibold text-purple-700 text-sm truncate">{entry.courseName}</div>
                                    <div className="text-xs text-muted-foreground truncate">{entry.teacherName}</div>
                                    <div className="text-xs text-muted-foreground">{entry.room || ''}</div>
                                  </div>
                                ) : (
                                  <div className="text-center text-muted-foreground">-</div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>الواجبات</CardTitle>
                </CardHeader>
                <CardContent id="assignments-list">
                  {fallback(liveAssignments, []).length > 0 ? fallback(liveAssignments, []).map((a: any) => (
                    <div key={a.id || a.title} className="ann-item" style={{ padding: 8, borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div><strong>{a.subject || a.courseName}</strong> — {a.title}</div>
                        <div style={{ fontWeight: 800 }}>{a.status || ''}</div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">لا توجد واجبات حالياً.</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>الدرجات</CardTitle>
                </CardHeader>
                <CardContent id="grades-list">
                  {fallback(liveCourses, enrolledCourses).length > 0 ? fallback(liveCourses, enrolledCourses).map((c: any) => (
                    <div key={c.id} style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: 700 }}>{c.name}</div>
                        <div style={{ fontWeight: 800 }}>{c.finalGrade !== null && c.finalGrade !== undefined ? `${Math.round(c.finalGrade)}%` : '—'}</div>
                      </div>
                    </div>
                  )) : <p className="text-sm text-muted-foreground">لا توجد درجات.</p>}
                </CardContent>
              </Card>
            </div>
          </section>

          <aside className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معلومات الطالب</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={`https://picsum.photos/seed/${student?.id}/200/200`} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div style={{ fontWeight: 700 }}>{student?.name}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>{student?.dob}</div>
                    <div style={{ fontSize: 13, color: '#6b7280' }}>الهاتف: {student?.contact}</div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div style={{ fontSize: 13 }}>
                  <div><strong>العنوان:</strong> {student?.address}</div>
                  <div><strong>الحالة الصحية:</strong> {student?.health}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>المعلمين</CardTitle>
              </CardHeader>
              <CardContent id="teachers-list">
                {fallback(liveTeachers, supportCourses).length > 0 ? fallback(liveTeachers, supportCourses).map((t: any, idx: number) => (
                  <div key={idx} style={{ padding: 8, borderBottom: '1px dashed #eef2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.name || t.teachers?.[0]?.name || 'مدرس'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{t.subject || t.name || ''}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <a className="btn ghost" href={`tel:${t.contact || ''}`}>📞 اتصال</a>
                      <button className="btn">✉️ رسالة</button>
                    </div>
                  </div>
                )) : <p className="text-sm text-muted-foreground">لا توجد معلومات المعلمين.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('common.accountActions')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <Button id="logout">{t('common.logout')}</Button>
                  <Button id="logout-devices" variant="outline">{t('common.logoutAllDevices')}</Button>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
