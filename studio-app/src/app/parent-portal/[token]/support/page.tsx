"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { validateParentAccessToken, getParentAccessRecord } from '@/services/parentService';
import { getSupportPrograms, createSupportSignupRequest } from '@/services/supportService';
import { getStudent } from '@/services/studentService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/i18n/translation-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Program {
  id: string;
  name: string;
  description: string;
  duration?: string;
  schedule?: string;
  teacher?: string;
  format?: string;
  status?: 'open' | 'limited' | 'closed';
}

export default function ParentSupportSignupPage() {
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();
  const { t } = useTranslation();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedPrograms, setSelectedPrograms] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProgramForDetails, setSelectedProgramForDetails] = useState<Program | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const studentId = await validateParentAccessToken(token);
        if (!studentId) {
          toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: 'destructive' });
          setIsLoading(false);
          return;
        }
        const student = await getStudent(studentId);
        const list = await getSupportPrograms();
        setPrograms(list || []);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('support.fetchError') || 'Failed to load programs.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [token, toast, t]);

  const toggleProgram = (programId: string) => {
    const updated = new Set(selectedPrograms);
    if (updated.has(programId)) {
      updated.delete(programId);
    } else {
      updated.add(programId);
    }
    setSelectedPrograms(updated);
  };

  const handleSubmit = async () => {
    if (!token || selectedPrograms.size === 0) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار برنامج واحد على الأقل', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const studentId = await validateParentAccessToken(token);
      if (!studentId) throw new Error('Invalid token');
      const access = await getParentAccessRecord(token);
      const parentName = access?.parentName;

      // Submit requests for all selected programs
      const promises = Array.from(selectedPrograms).map(courseId =>
        createSupportSignupRequest(studentId, courseId, parentName || undefined)
      );
      await Promise.all(promises);

      const count = selectedPrograms.size;
      toast({
        title: 'تم الإرسال بنجاح',
        description: `تم إرسال طلب التسجيل في ${count} برنامج دعم للإدارة الأكاديمية`,
        variant: 'default'
      });

      // Reset selection
      setSelectedPrograms(new Set());
    } catch (err) {
      console.error(err);
      toast({ title: t('common.error'), description: t('support.requestError') || 'Failed to submit request.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusDisplay = (status?: string) => {
    if (status === 'open') return { label: '🟢 مفتوح للتسجيل', className: 'bg-green-50 text-green-700 border-green-200' };
    if (status === 'limited') return { label: '🟡 أماكن محدودة', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
    return { label: '🔴 مغلق', className: 'bg-red-50 text-red-700 border-red-200' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">برامج الدعم</h1>
          <p className="text-slate-600">اختر برنامج دعم واحد أو أكثر للانضمام إليه</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600">جاري التحميل...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && programs.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center shadow-sm">
            <p className="text-slate-600">لا توجد برامج دعم متاحة حالياً</p>
          </div>
        )}

        {/* Programs Grid */}
        {!isLoading && programs.length > 0 && (
          <>
            <div className="space-y-4 mb-6">
              {programs.map(program => {
                const isSelected = selectedPrograms.has(program.id);
                const statusDisplay = getStatusDisplay(program.status);
                return (
                  <div
                    key={program.id}
                    onClick={() => toggleProgram(program.id)}
                    className={`
                      relative overflow-hidden rounded-lg border-2 cursor-pointer transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-slate-200 bg-white hover:shadow-md hover:border-slate-300'
                      }
                    `}
                  >
                    {/* Card Content */}
                    <div className="p-6">
                      {/* Header with Checkbox */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-900 mb-2">{program.name}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${statusDisplay.className}`}>
                              {statusDisplay.label}
                            </span>
                          </div>
                        </div>
                        {/* Custom Checkbox */}
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleProgram(program.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-6 h-6 rounded border-2 border-blue-400 checked:bg-blue-500 checked:border-blue-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-slate-700 text-sm mb-4 leading-relaxed">{program.description}</p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        {program.duration && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-blue-500">📅</span>
                            <span>المدة: {program.duration}</span>
                          </div>
                        )}
                        {program.schedule && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-blue-500">⏰</span>
                            <span>الوقت: {program.schedule}</span>
                          </div>
                        )}
                        {program.teacher && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-blue-500">👨‍🏫</span>
                            <span>المعلم: {program.teacher}</span>
                          </div>
                        )}
                        {program.format && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <span className="text-blue-500">💻</span>
                            <span>الشكل: {program.format}</span>
                          </div>
                        )}
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProgramForDetails(program);
                        }}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium underline"
                      >
                        عرض التفاصيل الكاملة
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Submit Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2">
                  <strong>ملاحظة:</strong> يمكنك اختيار أكثر من برنامج دعم. بعد الاختيار، سيتم إرسال طلب التسجيل للإدارة الأكاديمية للمراجعة والموافقة.
                </p>
              </div>

              {selectedPrograms.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    ✓ تم اختيار <strong>{selectedPrograms.size}</strong> برنامج دعم
                  </p>
                </div>
              )}

              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || selectedPrograms.size === 0}
                className={`w-full py-6 text-base font-semibold rounded-lg transition-all
                  ${selectedPrograms.size === 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                  }
                `}
              >
                {isSubmitting ? 'جاري الإرسال...' : `إرسال طلب التسجيل (${selectedPrograms.size})`}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Program Details Modal */}
      <Dialog open={!!selectedProgramForDetails} onOpenChange={() => setSelectedProgramForDetails(null)}>
        <DialogContent className="max-w-2xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedProgramForDetails?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-right">
            <p className="text-slate-700">{selectedProgramForDetails?.description}</p>
            
            {(selectedProgramForDetails?.duration || selectedProgramForDetails?.schedule || selectedProgramForDetails?.teacher || selectedProgramForDetails?.format) && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
                {selectedProgramForDetails?.duration && (
                  <p><strong>المدة:</strong> {selectedProgramForDetails.duration}</p>
                )}
                {selectedProgramForDetails?.schedule && (
                  <p><strong>الجدول الزمني:</strong> {selectedProgramForDetails.schedule}</p>
                )}
                {selectedProgramForDetails?.teacher && (
                  <p><strong>المعلم/المعلمة:</strong> {selectedProgramForDetails.teacher}</p>
                )}
                {selectedProgramForDetails?.format && (
                  <p><strong>الشكل:</strong> {selectedProgramForDetails.format}</p>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
