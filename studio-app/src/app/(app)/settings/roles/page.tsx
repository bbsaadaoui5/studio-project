"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getRoles, addRole, updateRole, type Role } from "@/services/roleService";
import { Loader2, Save, RotateCcw, X, CheckSquare, Square } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RolesManagementPage() {
  const { toast } = useToast();
  const { t } = useTranslation();

  const permissionCategories = [
    {
      key: 'finance',
      label: 'المالية',
      permissions: [
        { id: 'finance_invoices', label: 'إدارة الفواتير والمدفوعات' },
        { id: 'finance_reports', label: 'تقارير المالية' },
        { id: 'finance_budget', label: 'الميزانية والتخطيط' },
        { id: 'finance_expenses', label: 'إدارة المصروفات' },
        { id: 'finance_discounts', label: 'إدارة المنح والخصومات' },
      ]
    },
    {
      key: 'attendance',
      label: 'الحضور والانصراف',
      permissions: [
        { id: 'attendance_register', label: 'تسجيل الحضور والانصراف' },
        { id: 'attendance_reports', label: 'تقارير الحضور' },
        { id: 'attendance_leave', label: 'إدارة الإجازات والغياب' },
        { id: 'attendance_portal', label: 'بوابة أولياء الأمور' },
        { id: 'attendance_settings', label: 'إعدادات نظام الحضور' },
      ]
    },
    {
      key: 'institution',
      label: 'إدارة المؤسسة',
      permissions: [
        { id: 'institution_academic', label: 'الإدارة الأكاديمية' },
        { id: 'institution_exams', label: 'نظام الامتحانات' },
        { id: 'institution_grades', label: 'التقييمات والدرجات' },
        { id: 'institution_support', label: 'برامج الدعم الأكاديمي' },
        { id: 'institution_events', label: 'الفعاليات والأنشطة' },
        { id: 'institution_communication', label: 'التواصل والمشاركات' },
        { id: 'institution_resources', label: 'إدارة الموارد' },
      ]
    },
    {
      key: 'system',
      label: 'النظام والإعدادات',
      permissions: [
        { id: 'system_users', label: 'إدارة المستخدمين' },
        { id: 'system_roles', label: 'إدارة الأدوار والصلاحيات' },
        { id: 'system_settings', label: 'الإعدادات العامة' },
        { id: 'system_reports', label: 'تقارير النظام' },
        { id: 'system_backup', label: 'إدارة النسخ الاحتياطي' },
      ]
    }
  ];

  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const fetchRoles = useCallback(async () => {
    try {
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  }, []);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategoryPermissions = (category: string) => {
    const categoryPermissions = permissionCategories
      .find(c => c.key === category)
      ?.permissions.map(p => p.id) || [];

    const allSelected = categoryPermissions.every(p => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !categoryPermissions.includes(p)));
    } else {
      setSelectedPermissions(prev => [
        ...prev,
        ...categoryPermissions.filter(p => !prev.includes(p))
      ]);
    }
  };

  const getCategoryCheckedCount = (category: string) => {
    const categoryPermissions = permissionCategories
      .find(c => c.key === category)
      ?.permissions.map(p => p.id) || [];
    return categoryPermissions.filter(p => selectedPermissions.includes(p)).length;
  };

  const getAllPermissionsCount = () => {
    return permissionCategories.reduce((total, cat) => total + cat.permissions.length, 0);
  };

  const toggleAllPermissions = () => {
    const allPermissions = permissionCategories.flatMap(cat => cat.permissions.map(p => p.id));
    if (selectedPermissions.length === allPermissions.length) {
      // Deselect all
      setSelectedPermissions([]);
    } else {
      // Select all
      setSelectedPermissions(allPermissions);
    }
  };

  async function handleSaveRole() {
    if (!roleName.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال اسم الدور",
        variant: "destructive",
      });
      return;
    }

    if (roleDescription.trim().length < 10) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال وصف يحتوي على 10 أحرف على الأقل",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addRole({
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
      } as any);

      toast({
        title: "تم",
        description: `تم إنشاء الدور "${roleName}" بنجاح مع ${selectedPermissions.length} صلاحية`,
      });

      // Reset form
      setRoleName("");
      setRoleDescription("");
      setSelectedPermissions([]);
      void fetchRoles();
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الدور. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
      console.error("Error creating role:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 overflow-x-hidden">
      <div className="mx-auto max-w-5xl">
        {/* Back Button */}
        <Link href="/settings">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            العودة إلى الإعدادات
          </Button>
        </Link>

        {/* Main Container */}
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-l from-sky-700 via-sky-600 to-indigo-600 px-8 py-8 text-white">
            <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold">
              <span className="text-4xl">🛡️</span>
              إضافة دور جديد
            </h1>
            <p className="text-lg opacity-90">قم بتعريف دور جديد في النظام وتحديد صلاحياته</p>
          </div>

          {/* Content */}
          <div className="space-y-8 p-8">
            {/* Role Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100">
                  <span className="text-lg">ℹ️</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900">معلومات الدور</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    اسم الدور
                  </label>
                  <Input
                    placeholder="أدخل اسم الدور"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">
                    وصف الدور
                  </label>
                  <Textarea
                    placeholder="وصف مختصر لمهام ومسؤوليات هذا الدور"
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="min-h-[100px] border-slate-200"
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            {/* Permissions Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                    <span className="text-lg">🔐</span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">صلاحيات الأدوار</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAllPermissions}
                  className="gap-2 border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100"
                >
                  <CheckSquare className="h-4 w-4" />
                  {selectedPermissions.length === getAllPermissionsCount() ? "إلغاء تحديد الكل" : "تحديد الكل"}
                </Button>
              </div>
              <p className="text-sm text-slate-600">حدد الصلاحيات الممنوحة لهذا الدور في النظام</p>

              {/* Permission Categories Grid */}
              <div className="grid gap-6 md:grid-cols-2">
                {permissionCategories.map((category) => (
                  <div
                    key={category.key}
                    className="overflow-hidden rounded-xl border border-slate-200 transition-all hover:border-sky-300 hover:shadow-lg"
                  >
                    {/* Category Header */}
                    <div
                      className="flex cursor-pointer items-center justify-between bg-gradient-to-l from-slate-50 to-white p-4 transition-colors hover:bg-slate-100"
                      onClick={() => toggleCategoryPermissions(category.key)}
                    >
                      <div className="flex items-center gap-3 text-right flex-1">
                        <h3 className="font-bold text-slate-900">{category.label}</h3>
                      </div>
                      <button className="ml-2 rounded-lg bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700 transition-colors hover:bg-sky-200">
                        تحديد الكل
                      </button>
                    </div>

                    {/* Permission Items */}
                    <div className="space-y-0 divide-y divide-slate-100 bg-white p-3">
                      {category.permissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 px-2 py-3 transition-colors hover:bg-sky-50 cursor-pointer text-right"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => togglePermission(permission.id)}
                            className="h-4 w-4 rounded border-slate-300 accent-sky-600 cursor-pointer"
                          />
                          <span className="flex-1 text-sm text-slate-700">{permission.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Category Footer */}
                    <div className="bg-slate-50 px-4 py-2 text-xs text-slate-600">
                      {getCategoryCheckedCount(category.key)} / {category.permissions.length} محدد
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            {/* Action Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => handleReset()}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                إعادة تعيين
              </Button>
              <Button
                variant="outline"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                إلغاء
              </Button>
              <Button
                onClick={handleSaveRole}
                disabled={isSubmitting}
                className="btn-gradient btn-click-effect gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "جاري الحفظ..." : "حفظ الدور"}
              </Button>
            </div>

            {/* Footer Note */}
            <div className="rounded-lg border-r-4 border-r-sky-600 bg-sky-50 px-4 py-3 text-sm text-slate-700">
              <span className="font-semibold">ملاحظة:</span> سيتم تطبيق الصلاحيات المحددة فور حفظ الدور الجديد. يمكن تعديل هذه الصلاحيات لاحقاً من خلال صفحة إدارة الأدوار.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
