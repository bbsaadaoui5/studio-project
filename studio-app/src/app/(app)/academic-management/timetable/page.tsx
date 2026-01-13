
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Loader2, PlusCircle, CalendarDays, Printer, Edit, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useTranslation } from '@/i18n/translation-provider'
import { getTimetableForClass, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry } from '@/services/timetableService'
import { getCourses } from '@/services/courseService'
import { getStudents } from '@/services/studentService'
import { getSettings } from '@/services/settingsService'
import { getExams } from '@/services/examService'
import { Course, TimetableEntry, ClassInfo, Exam } from '@/lib/types'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

const TimetableAdmin = dynamic(() => import('@/components/Timetable/TimetableEditor'), { ssr: false })

const daysOfWeek = [
    { key: 'Monday', label: 'الاثنين' },
    { key: 'Tuesday', label: 'الثلاثاء' },
    { key: 'Wednesday', label: 'الأربعاء' },
    { key: 'Thursday', label: 'الخميس' },
    { key: 'Friday', label: 'الجمعة' },
]

const timeSlots = [
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
]

const timetableSchema = z.object({
    courseId: z.string().min(1),
    day: z.string().min(1),
    timeSlot: z.string().min(1),
    notes: z.string().optional(),
})

export default function TimetablePage() {
    const { toast } = useToast()
    const { t } = useTranslation()
    const [allClasses, setAllClasses] = useState<ClassInfo[]>([])
    const [courses, setCourses] = useState<Course[]>([])
    const [exams, setExams] = useState<Exam[]>([])
    const [selectedClassId, setSelectedClassId] = useState<string>('')
    const [timetable, setTimetable] = useState<TimetableEntry[]>([])
    const [schoolName, setSchoolName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [selectedEntry, setSelectedEntry] = useState<TimetableEntry | null>(null)
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0) // 0 = current week, 1 = next week, -1 = previous week
    const [editingInPlaceId, setEditingInPlaceId] = useState<string | null>(null)
    const [editingInPlaceValues, setEditingInPlaceValues] = useState<Partial<TimetableEntry> | null>(null)
    const editFirstInputRef = useRef<HTMLInputElement | null>(null)
    const [liveMessage, setLiveMessage] = useState<string>('')
    const editingContainerRef = useRef<HTMLDivElement | null>(null)
    const [dayFilter, setDayFilter] = useState<string>('All')
    const [entryToDelete, setEntryToDelete] = useState<TimetableEntry | null>(null)
    const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)

    const form = useForm<z.infer<typeof timetableSchema>>({
        resolver: zodResolver(timetableSchema),
        defaultValues: { courseId: '', day: '', timeSlot: '', notes: '' },
    })

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [students, fetchedCourses, settings, fetchedExams] = await Promise.all([
                    getStudents(),
                    getCourses(),
                    getSettings(),
                    getExams(),
                ])

                const classesMap = new Map<string, number>()
                students.forEach((student) => {
                    if (student.status === 'active') {
                        const classId = `${student.grade}-${student.className}`
                        classesMap.set(classId, (classesMap.get(classId) || 0) + 1)
                    }
                })

                const classList = Array.from(classesMap.entries())
                    .map(([id, studentCount]) => {
                        const [grade, className] = id.split('-')
                        return { id, grade, className, studentCount }
                    })
                    .sort((a, b) => parseInt(a.grade) - parseInt(b.grade) || a.className.localeCompare(b.className))

                setAllClasses(classList)
                setCourses(fetchedCourses)
                setExams(fetchedExams)
                setSchoolName(settings.schoolName)

                if (classList.length > 0) setAllClasses(classList)
                // لا نختار أي صف افتراضياً - يجب أن يختار المستخدم الصف بنفسه
            } catch (error) {
                toast({ title: t('common.error'), description: t('timetable.failedToFetchInitialData'), variant: 'destructive' })
            }
        }
        fetchInitialData()
    }, [toast])

    const selectedClassInfo = useMemo(() => allClasses.find((c) => c.id === selectedClassId), [allClasses, selectedClassId])

    const fetchTimetable = useCallback(
        async (grade: string, className: string) => {
            setIsLoading(true)
            try {
                const fetched = await getTimetableForClass(grade, className)
                setTimetable(fetched)
            } catch (err) {
                toast({ title: t('common.error'), description: t('timetable.failedToFetchTimetable'), variant: 'destructive' })
            } finally {
                setIsLoading(false)
            }
        },
        [toast]
    )

    useEffect(() => {
        if (!selectedClassInfo) return
        fetchTimetable(selectedClassInfo.grade, selectedClassInfo.className)
    }, [selectedClassInfo, fetchTimetable])

    const getEntryForSlot = (day: string, timeSlot: string) => timetable.find((e) => e.day === day && e.timeSlot === timeSlot)

    // دالة لحساب نطاق تواريخ الأسبوع (من الاثنين إلى الجمعة)
    const weekRange = useMemo(() => {
        const today = new Date()
        const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
        const diff = currentDay === 0 ? -6 : 1 - currentDay // Calculate days to Monday
        
        const monday = new Date(today)
        monday.setDate(today.getDate() + diff + (currentWeekOffset * 7))
        monday.setHours(0, 0, 0, 0)
        
        const friday = new Date(monday)
        friday.setDate(monday.getDate() + 4)
        friday.setHours(23, 59, 59, 999)
        
        return { monday, friday }
    }, [currentWeekOffset])

    const weekRangeText = useMemo(() => {
        const monthName = weekRange.monday.toLocaleDateString('ar-SA', { month: 'long' })
        const year = weekRange.monday.getFullYear()
        return `${weekRange.monday.getDate()} - ${weekRange.friday.getDate()} ${monthName} ${year}`
    }, [weekRange])

    // دالة لحساب تاريخ كل يوم في الأسبوع
    const getDayDate = useCallback((dayKey: string): string => {
        const dayIndex = daysOfWeek.findIndex(d => d.key === dayKey)
        if (dayIndex === -1) return ''
        
        const dayDate = new Date(weekRange.monday)
        dayDate.setDate(weekRange.monday.getDate() + dayIndex)
        
        return `${dayDate.getMonth() + 1}/${dayDate.getDate()}`
    }, [weekRange])

    // دالة لاستخراج اليوم من تاريخ الامتحان
    const getExamDay = (examDate: string): string | null => {
        try {
            const date = new Date(examDate)
            // تحويل إلى تاريخ محلي لتجنب مشاكل المنطقة الزمنية
            const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
            const dayOfWeek = localDate.toLocaleDateString('ar-SA', { weekday: 'long' })
            
            // تحويل اسم اليوم من العربية إلى المفتاح الإنجليزي
            const dayMap: { [key: string]: string } = {
                'الاثنين': 'Monday',
                'الثلاثاء': 'Tuesday',
                'الأربعاء': 'Wednesday',
                'الخميس': 'Thursday',
                'الجمعة': 'Friday',
            }
            
            return dayMap[dayOfWeek] || null
        } catch {
            return null
        }
    }

    // استخراج الامتحانات الخاصة بالفصل المحدد في الأسبوع الحالي
    const classExams = useMemo(() => {
        if (!selectedClassInfo) return []
        
        return exams.filter((exam) => {
            if (!exam.classes || exam.classes.length === 0) return false
            const hasClass = exam.classes.some(classId => classId === selectedClassInfo.id)
            if (!hasClass) return false
            
            // تحقق من أن تاريخ الامتحان يقع في نطاق الأسبوع المحدد
            const examDate = new Date(exam.examDate)
            examDate.setHours(0, 0, 0, 0)
            return examDate >= weekRange.monday && examDate <= weekRange.friday
        })
    }, [exams, selectedClassInfo, weekRange])

    const filteredDays = useMemo(() => {
        if (dayFilter === 'All') return daysOfWeek
        return daysOfWeek.filter(d => d.key === dayFilter)
    }, [dayFilter])

    // تصفية المواد لعرض فقط المواد المخصصة للشعبة المحددة
    const classSpecificCourses = useMemo(() => {
        if (!selectedClassInfo) return []
        
        console.log('🔍 TIMETABLE - Filtering courses for class:', selectedClassInfo);
        console.log('📚 TIMETABLE - All courses:', courses.map(c => ({ id: c.id, name: c.name, grade: c.grade, sections: c.sections })));
        
        const filtered = courses.filter(course => {
            // Check if course is for this grade
            const gradeMatch = course.grade === selectedClassInfo.grade;
            // Check if sections is defined and includes this className, OR if sections is undefined (backward compatibility)
            const sectionMatch = !course.sections || course.sections.length === 0 || course.sections.includes(selectedClassInfo.className);
            
            const match = gradeMatch && sectionMatch;
            if (!match) {
                console.log(`⏭️ Skipping course "${course.name}" (ID: ${course.id}) - Grade: ${course.grade} (need ${selectedClassInfo.grade}), Sections:`, course.sections);
            } else {
                console.log(`✅ Including course "${course.name}" (ID: ${course.id}) - Grade: ${course.grade}, Sections:`, course.sections);
            }
            
            return match;
        });
        
        console.log('📋 TIMETABLE - Filtered courses:', filtered.map(c => ({ id: c.id, name: c.name })));
        
        if (filtered.length === 0) {
            console.warn('⚠️ TIMETABLE - No courses found for this class! This may be because:');
            console.warn('   1. No courses exist for grade', selectedClassInfo.grade);
            console.warn('   2. Courses exist but sections array is empty or doesn\'t include', selectedClassInfo.className);
            console.warn('   💡 Solution: Make sure courses have sections array populated, or leave it empty/undefined for all sections');
        }
        
        return filtered;
    }, [courses, selectedClassInfo])

    async function onSubmit(values: z.infer<typeof timetableSchema>) {
        if (!selectedClassInfo) return
        const selectedCourse = courses.find((c) => c.id === values.courseId)
        if (!selectedCourse) return

        setIsSubmitting(true)
        try {
            const newEntry = {
                grade: selectedClassInfo.grade,
                className: selectedClassInfo.className,
                day: values.day as TimetableEntry['day'],
                timeSlot: values.timeSlot,
                courseId: values.courseId,
                courseName: selectedCourse.name,
                teacherName: selectedCourse.teachers?.[0]?.name || 'TBA',
                notes: values.notes,
            }

            const result = await addTimetableEntry(newEntry)
            console.debug('Entry added successfully (service):', result)
            toast({ title: t('timetable.entryAdded'), description: t('timetable.timetableUpdated') })
            fetchTimetable(selectedClassInfo.grade, selectedClassInfo.className)
            form.reset()
            setIsDialogOpen(false)
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : t('timetable.failedToAddEntry')
            toast({ title: t('common.error'), description: errorMessage, variant: 'destructive' })
        } finally {
            setIsSubmitting(false)
        }
    }

    const handlePrint = () => window.print()

    const handleEditClick = (entry: TimetableEntry) => {
        // Enter in-place edit mode for the clicked table cell
        setEditingInPlaceId(entry.id || null)
        setEditingInPlaceValues({ ...entry })
        // reset editForm as well for consistency
        editForm.reset({ courseId: entry.courseId, day: entry.day, timeSlot: entry.timeSlot, notes: entry.notes || '' })
        // live region: announce entering edit mode for screen readers
        setLiveMessage('Entering edit mode')
    }

    useEffect(() => {
        if (editingInPlaceId) {
            // focus first input when entering in-place edit
            setTimeout(() => {
                editFirstInputRef.current?.focus()
            }, 50)
        }
    }, [editingInPlaceId])

    // Save handler shared so keyboard shortcut can reuse it
    const saveEditingInPlace = useCallback(async () => {
        if (!editingInPlaceId) return
        const entry = timetable.find(e => e.id === editingInPlaceId)
        if (!entry) return
        try {
            const patch = {
                courseName: editingInPlaceValues?.courseName || entry.courseName,
                teacherName: editingInPlaceValues?.teacherName || entry.teacherName,
                notes: editingInPlaceValues?.notes || entry.notes,
                day: editingInPlaceValues?.day || entry.day,
                timeSlot: editingInPlaceValues?.timeSlot || entry.timeSlot,
            }
            await updateTimetableEntry(entry.id!, patch)
            toast({ title: t('timetable.entryUpdated'), description: t('timetable.timetableUpdated') })
            setEditingInPlaceId(null)
            setEditingInPlaceValues(null)
            setLiveMessage('Entry updated')
            if (selectedClassInfo) fetchTimetable(selectedClassInfo.grade, selectedClassInfo.className)
        } catch (err) {
            toast({ title: t('common.error'), description: t('timetable.failedToUpdateEntry'), variant: 'destructive' })
        }
    }, [editingInPlaceId, editingInPlaceValues, timetable, selectedClassInfo, fetchTimetable, toast])

    // Keyboard shortcut for Save (Ctrl/Cmd+Enter) and focus trap while editing
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (!editingInPlaceId) return
            // Ctrl/Cmd + Enter -> save
            if ((e.key === 'Enter') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                void saveEditingInPlace()
            }
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [editingInPlaceId, saveEditingInPlace])

    // Focus-trap handler for editing container (keeps Tab inside)
    const handleEditingContainerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key !== 'Tab') return
        const container = editingContainerRef.current
        if (!container) return
        const focusable = Array.from(container.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"))
            .filter(el => !el.hasAttribute('disabled'))
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
        }
    }

    const handleDelete = async (entry: TimetableEntry) => {
        setEntryToDelete(entry)
    }

    const confirmDelete = async () => {
        if (!entryToDelete || !entryToDelete.id) return
        setIsDeleteConfirming(true)
        try {
            await deleteTimetableEntry(entryToDelete.id)
            toast({ title: t('timetable.entryRemoved'), description: t('timetable.timetableUpdated') })
            setLiveMessage('Entry deleted')
            if (selectedClassInfo) fetchTimetable(selectedClassInfo.grade, selectedClassInfo.className)
        } catch (err) {
            toast({ title: t('common.error'), description: t('timetable.failedToDeleteEntry'), variant: 'destructive' })
        } finally {
            setIsDeleteConfirming(false)
            setEntryToDelete(null)
        }
    }

    const editSchema = timetableSchema
    const editForm = useForm<z.infer<typeof editSchema>>({ resolver: zodResolver(editSchema), defaultValues: { courseId: '', day: '', timeSlot: '', notes: '' } })

    async function onEditSubmit(values: z.infer<typeof editSchema>) {
        if (!selectedEntry) return
        try {
            const patch = {
                courseId: values.courseId,
                courseName: courses.find(c => c.id === values.courseId)?.name || selectedEntry.courseName,
                teacherName: courses.find(c => c.id === values.courseId)?.teachers?.[0]?.name || selectedEntry.teacherName,
                day: values.day as TimetableEntry['day'],
                timeSlot: values.timeSlot,
                notes: values.notes,
            }
            await updateTimetableEntry(selectedEntry.id!, patch)
            toast({ title: t('timetable.entryUpdated'), description: t('timetable.timetableUpdated') })
            setSelectedEntry(null)
            if (selectedClassInfo) fetchTimetable(selectedClassInfo.grade, selectedClassInfo.className)
        } catch (err) {
            toast({ title: t('common.error'), description: t('timetable.failedToUpdateEntry'), variant: 'destructive' })
        }
    }

    return (
        <>
            <style jsx global>{`
                @media print {
                    .no-print { display: none !important; }
                    body { margin: 0; padding: 0; }
                    .print-area { margin: 0; padding: 0; }
                    .print-header { display: block !important; }
                    .border { border-collapse: collapse; }
                    .grid { table-layout: auto; }
                    * { page-break-inside: avoid; }
                }
            `}</style>
            <div className="p-4">
                <div role="status" aria-live="polite" style={{position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden'}}> {liveMessage} </div>
                <div className="flex justify-end mb-4">
                    <details className="ml-2">
                        <summary className="cursor-pointer">لوحة الإدارة — عرض الجدول (إدارة)</summary>
                        <div className="mt-3">
                            <TimetableAdmin grade={selectedClassInfo?.grade || '9'} className={selectedClassInfo?.className || 'A'} initial={timetable} />
                        </div>
                    </details>
                </div>
            </div>

            <div className="flex flex-col gap-6 no-print p-4">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>جداول الحصص</CardTitle>
                                <CardDescription>الجدول الأسبوعي للصف {selectedClassInfo?.grade} - الشعبة {selectedClassInfo?.className}</CardDescription>
                            </div>
                            
                            {/* Week Navigation */}
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(currentWeekOffset - 1)}>
                                    ← الأسبوع السابق
                                </Button>
                                <div className="px-4 py-2 bg-muted rounded-md text-sm font-medium">
                                    {weekRangeText}
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setCurrentWeekOffset(currentWeekOffset + 1)}>
                                    الأسبوع التالي →
                                </Button>
                                {currentWeekOffset !== 0 && (
                                    <Button variant="ghost" size="sm" onClick={() => setCurrentWeekOffset(0)}>
                                        الأسبوع الحالي
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                            <div className="w-48 space-y-2">
                                <Select onValueChange={setSelectedClassId} value={selectedClassId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="اختر صفاً" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {allClasses.map((c) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                الصف {c.grade} - الشعبة {c.className}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-40 space-y-2">
                                <Select onValueChange={setDayFilter} value={dayFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="كل الأيام" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">الكل</SelectItem>
                                        {daysOfWeek.map(d => (
                                            <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button disabled={!selectedClassId} title={!selectedClassId ? "اختر صفاً وشعبة أولاً" : ""}>
                                        <PlusCircle /> أضف إلى الجدول
                                    </Button>
                                </DialogTrigger>

                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>إضافة حصة جديدة</DialogTitle>
                                        <DialogDescription>
                                            جدولة حصة جديدة للصف {selectedClassInfo?.grade} - الشعبة {selectedClassInfo?.className}.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="courseId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>المادة</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="اختر مادة" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {classSpecificCourses.map((course) => (
                                                                    <SelectItem key={course.id} value={course.id}>
                                                                        {course.name} - {course.teachers?.[0]?.name || 'غير محدد'}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="day"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>اليوم</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="اختر يومًا" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {daysOfWeek.map((d) => (
                                                                        <SelectItem key={d.key} value={d.key}>
                                                                            {d.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="timeSlot"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>الفترة</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="اختر الفترة الزمنية" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {timeSlots.map((slot) => (
                                                                        <SelectItem key={slot} value={slot}>
                                                                            {slot}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="notes"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>ملاحظات (اختياري)</FormLabel>
                                                        <FormControl>
                                                            <Textarea placeholder="مثال: حصة مختبر، إحضار الكتب..." {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <DialogFooter className="pt-4">
                                                <Button type="submit" disabled={isSubmitting}>
                                                    {isSubmitting && <Loader2 className="animate-spin" />} {isSubmitting ? 'جارٍ الإضافة...' : 'أضف إلى الجدول'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </DialogContent>
                            </Dialog>

                            <Button variant="outline" onClick={handlePrint} disabled={!selectedClassId || isLoading} aria-label="Print timetable">
                                <Printer className="mr-2 h-4 w-4" /> Print
                            </Button>

                            {/* Inline Edit Panel: when a timetable entry is selected, show an edit form here (not in-table) */}
                            {selectedEntry && (
                                <div className="w-full border rounded p-4 bg-muted no-print">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <div className="font-medium">تحرير الحصة المحددة</div>
                                            <div className="text-sm text-muted-foreground">{selectedEntry.courseName} — {selectedEntry.day} {selectedEntry.timeSlot}</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" onClick={() => { setSelectedEntry(null); editForm.reset(); }}>
                                                إلغاء
                                            </Button>
                                        </div>
                                    </div>

                                    <Form {...editForm}>
                                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                                            <FormField
                                                control={editForm.control}
                                                name="courseId"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>المادة</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="اختر مادة" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {classSpecificCourses.map((course) => (
                                                                    <SelectItem key={course.id} value={course.id}>
                                                                        {course.name} - {course.teachers?.[0]?.name || 'غير محدد'}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField
                                                    control={editForm.control}
                                                    name="day"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>اليوم</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="اختر يومًا" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {daysOfWeek.map((d) => (
                                                                        <SelectItem key={d.key} value={d.key}>{d.label}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={editForm.control}
                                                    name="timeSlot"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>الفترة</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="اختر الفترة" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    {timeSlots.map((s) => (
                                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={editForm.control}
                                                name="notes"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>ملاحظات (اختياري)</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <div className="flex gap-2">
                                                <Button type="submit">حفظ التعديلات</Button>
                                                <Button variant="destructive" onClick={() => selectedEntry && handleDelete(selectedEntry)}>حذف الحصة</Button>
                                            </div>
                                        </form>
                                    </Form>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div className="print-area p-4" style={{ pageBreakInside: 'avoid' }}>
                <Card className="print:border-0 print:shadow-none">
                    <CardContent className="pt-6 print:p-0 print:pt-0">
                        <div className="print-header hidden print:block text-center mb-4">
                            <h1 className="text-xl font-bold">{schoolName}</h1>
                            <h2 className="text-lg font-semibold">الجدول الدراسي</h2>
                            <p className="text-muted-foreground text-lg">الصف {selectedClassInfo?.grade} - الشعبة {selectedClassInfo?.className}</p>
                        </div>

                        {isLoading && (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        )}

                        {!isLoading && selectedClassId && (
                            <div key={`week-${currentWeekOffset}`} className="border rounded-lg bg-white w-full" style={{ overflow: 'visible' }}>
                                <div className="grid w-full" style={{ gridTemplateColumns: '100px repeat(' + filteredDays.length + ', 1fr)' }}>
                                    <div className="font-semibold bg-muted p-2 border-b border-r text-xs text-center">
                                        <CalendarDays className="inline-block h-3 w-3 mr-1" /> الوقت
                                    </div>
                                    {filteredDays.map((d) => (
                                        <div key={d.key} className="font-semibold bg-muted p-2 text-center border-b border-r last:border-r-0 text-xs">
                                            <div>{d.label}</div>
                                            <div className="text-xs text-muted-foreground">{getDayDate(d.key)}</div>
                                        </div>
                                    ))}

                                    {timeSlots.map((timeSlot) => (
                                        <div key={timeSlot} className="contents">
                                            <div className="p-2 border-b border-r font-mono text-xs text-center whitespace-normal break-words" style={{ minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{timeSlot}</div>
                                            {filteredDays.map((d) => {
                                                const entry = getEntryForSlot(d.key, timeSlot)
                                                // ابحث عن الامتحانات في هذا اليوم
                                                const examForDay = classExams.find(exam => {
                                                    const examDay = getExamDay(exam.examDate)
                                                    return examDay === d.key
                                                })
                                                
                                                // إذا كان هناك امتحان في هذا اليوم وهذا هو أول وقت في الجدول، اعرضه
                                                const shouldShowExam = examForDay && timeSlot === '08:00 - 09:00'
                                                
                                                return (
                                                    <div key={`${d.key}-${timeSlot}`} className="p-1 border-b border-r last:border-r-0 text-center min-h-[80px] overflow-y-auto">
                                                        {shouldShowExam ? (
                                                            // عرض الامتحان
                                                            <div className="bg-amber-100 text-amber-900 p-1 rounded-md relative border border-amber-400 text-left">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <div className="flex-1">
                                                                        <p className="font-semibold text-xs">📝 {examForDay.title}</p>
                                                                        <p className="text-xs text-amber-900">{examForDay.courseName}</p>
                                                                        <p className="text-xs">⏱️ {examForDay.duration}د</p>
                                                                        {examForDay.room && <p className="text-xs">🚪 {examForDay.room}</p>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : entry ? (
                                                            editingInPlaceId === entry.id ? (
                                                                <div ref={editingContainerRef} onKeyDown={handleEditingContainerKeyDown} role="dialog" aria-label={`Edit ${editingInPlaceValues?.courseName || 'timetable entry'}`} className="bg-primary/10 text-primary p-2 rounded-md relative no-print">
                                                                    <div className="flex flex-col items-stretch gap-2">
                                                                            <div className="flex gap-2">
                                                                            <input id={`edit-input-${entry.id}`} ref={editFirstInputRef} className="flex-1 p-1 border rounded" aria-label="اسم المادة" value={editingInPlaceValues?.courseName || ''} onChange={(e) => setEditingInPlaceValues(v => ({ ...(v||{}), courseName: e.target.value }))} onKeyDown={(e) => {
                                                                                if (e.key === 'Escape') { e.stopPropagation(); setEditingInPlaceId(null); setEditingInPlaceValues(null); }
                                                                                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); /* handled by Save button click below */ }
                                                                            }} />
                                                                            <input className="flex-1 p-1 border rounded" aria-label="اسم المدرس" value={editingInPlaceValues?.teacherName || ''} onChange={(e) => setEditingInPlaceValues(v => ({ ...(v||{}), teacherName: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditingInPlaceId(null); setEditingInPlaceValues(null); } }} />
                                                                        </div>
                                                                        <input className="p-1 border rounded" aria-label="ملاحظات" value={editingInPlaceValues?.notes || ''} onChange={(e) => setEditingInPlaceValues(v => ({ ...(v||{}), notes: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setEditingInPlaceId(null); setEditingInPlaceValues(null); } }} />
                                                                        <div className="flex justify-end gap-2">
                                                                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditingInPlaceId(null); setEditingInPlaceValues(null); }}>إلغاء</Button>
                                                                            <Button size="sm" aria-keyshortcuts="Ctrl+Enter" onClick={async (e) => { e.stopPropagation(); await saveEditingInPlace(); }}>حفظ</Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="bg-primary/10 text-primary p-1 rounded-md relative text-left cursor-pointer" onClick={() => handleEditClick(entry)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleEditClick(entry); } }} aria-label={`Open editor for ${entry.courseName}`}>
                                                                    <div className="flex justify-between items-start gap-1">
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-semibold text-xs truncate">{entry.courseName}</p>
                                                                            <p className="text-xs text-primary truncate">{entry.teacherName}</p>
                                                                            {entry.notes && <p className="text-xs italic text-primary/60 truncate">{entry.notes}</p>}
                                                                        </div>
                                                                        <div className="flex gap-1 no-print flex-shrink-0">
                                                                            <Button size="xs" variant="outline" onClick={(e) => { e.stopPropagation(); handleEditClick(entry) }} aria-label="Edit entry" className="h-5 w-5 p-0">
                                                                                <Edit className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button size="xs" variant="ghost" onClick={(e) => { e.stopPropagation(); setEntryToDelete(entry) }} aria-label="Delete entry" className="h-5 w-5 p-0">
                                                                                <Trash2 className="h-3 w-3 text-destructive" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isLoading && !selectedClassId && (
                            <div className="text-center py-12 text-muted-foreground no-print">
                                <p>يرجى اختيار صفاً لعرض الجدول الزمني.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!entryToDelete} onOpenChange={(open) => { if (!open) setEntryToDelete(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            هل تريد حذف حصة {entryToDelete?.courseName} من {entryToDelete?.day}؟ 
                            <br />
                            <span className="text-destructive font-semibold">هذا الإجراء لا يمكن التراجع عنه.</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isDeleteConfirming} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isDeleteConfirming ? 'جارٍ الحذف...' : 'حذف الحصة'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
