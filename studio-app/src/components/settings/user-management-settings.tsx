
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2, ShieldCheck, Users, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getRoles, addRole, updateRole, type Role } from "@/services/roleService";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";


export function UserManagementSettings() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const roleSchema = z.object({
    name: z.string().min(2, t('settings.userManagement.roleNameMinLength')),
    description: z.string().min(10, t('settings.userManagement.descriptionMinLength')),
  });

  // Permission categories
  const permissionCategories = [
    {
      key: 'finance',
      icon: '💰',
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
      icon: '📅',
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
      icon: '🎓',
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
      icon: '⚙️',
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

  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editForm = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedRoles = await getRoles();
      setRoles(fetchedRoles);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('settings.userManagement.couldNotFetchRoles'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, t]);

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);
  
  async function onSubmit(values: z.infer<typeof roleSchema>) {
    setIsSubmitting(true);
    try {
        await addRole(values);
        toast({ title: t('settings.userManagement.roleCreated'), description: t('settings.userManagement.roleCreatedMessage', { name: values.name })});
        void fetchRoles();
        form.reset();
    } catch (error) {
        toast({ title: t('common.error'), description: t('settings.userManagement.failedToCreateRole'), variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  }

  async function onEditSubmit(values: z.infer<typeof roleSchema>) {
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
        await updateRole(selectedRole.id, values);
        toast({ 
          title: t('common.success'), 
          description: t('settings.userManagement.roleUpdatedMessage', { name: values.name })
        });
        void fetchRoles();
        editForm.reset();
        setIsEditDialogOpen(false);
        setSelectedRole(null);
    } catch (error) {
        toast({ 
          title: t('common.error'), 
          description: t('settings.userManagement.failedToUpdateRole'), 
          variant: "destructive"
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  function handleEditClick(role: Role) {
    setSelectedRole(role);
    editForm.setValue('name', role.name);
    editForm.setValue('description', role.description);
    setIsEditDialogOpen(true);
  }

  function handlePermissionsClick(role: Role) {
    setSelectedRole(role);
    setSelectedPermissions((role as any).permissions || []);
    setIsPermissionsDialogOpen(true);
  }

  function togglePermission(permissionId: string) {
    setSelectedPermissions(prev =>
      prev.includes(permissionId)
        ? prev.filter(p => p !== permissionId)
        : [...prev, permissionId]
    );
  }

  function toggleCategoryPermissions(category: string) {
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
  }

  async function savePermissions() {
    if (!selectedRole) return;
    setIsSubmitting(true);
    try {
      await updateRole(selectedRole.id, {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedPermissions,
      } as any);
      toast({
        title: t('common.success'),
        description: `تم تحديث صلاحيات الدور "${selectedRole.name}" بنجاح`
      });
      void fetchRoles();
      setIsPermissionsDialogOpen(false);
      setSelectedRole(null);
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'فشل في تحديث الصلاحيات',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
        <div className="bg-gradient-to-l from-sky-700 via-sky-600 to-indigo-600 px-6 py-5 text-white">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1 text-right sm:text-left">
              <p className="text-sm opacity-90">{t('settings.userManagement.userRolesPermissions')}</p>
              <h1 className="text-2xl font-semibold">{t('settings.userManagement.defineRolesDescription')}</h1>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-2 backdrop-blur">
              <ShieldCheck className="h-6 w-6 text-amber-200" />
              <div className="text-sm">
                <div className="font-semibold">{t('settings.userManagement.addNewRole')}</div>
                <div className="text-white/80">{t('settings.userManagement.editPermissions')}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-3">
          <Card className="bg-slate-50 shadow-none lg:col-span-1">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="space-y-1 text-right">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t('settings.userManagement.addNewRole')}</p>
                  <h2 className="text-lg font-semibold text-slate-900">{t('settings.userManagement.createNewRole')}</h2>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1 text-slate-700">
                  <Users className="h-4 w-4" />
                  {roles.length}
                </Badge>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">{t('settings.userManagement.roleName')}</FormLabel>
                        <FormControl>
                          <Input
                            className="text-right"
                            placeholder={t('settings.userManagement.roleNamePlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-right">{t('settings.userManagement.description')}</FormLabel>
                        <FormControl>
                          <Textarea
                            className="text-right"
                            placeholder={t('settings.userManagement.descriptionPlaceholder')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => form.reset()}
                      className="flex-1 sm:flex-none"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="btn-gradient btn-click-effect flex-1 sm:flex-none">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isSubmitting ? t('common.saving') : t('settings.userManagement.saveRole')}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 shadow-none">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-hidden">
                  <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <span>{t('settings.userManagement.userRolesPermissions')}</span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                      {t('settings.userManagement.usersCount', { count: roles.reduce((acc, r) => acc + (r.userCount ?? 0), 0) })}
                    </span>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right text-slate-700">{t('settings.userManagement.role')}</TableHead>
                        <TableHead className="text-right text-slate-700">{t('settings.userManagement.description')}</TableHead>
                        <TableHead className="text-right text-slate-700">{t('settings.userManagement.users')}</TableHead>
                        <TableHead className="text-right text-slate-700">{t('common.actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {roles.length > 0 ? (
                        roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell className="font-medium text-right text-slate-900">{role.name}</TableCell>
                            <TableCell className="text-right text-slate-600">{role.description}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="secondary" className="bg-slate-100 text-slate-800">
                                {t('settings.userManagement.usersCount', { count: role.userCount })}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePermissionsClick(role)}
                                  className="text-right"
                                >
                                  <ShieldCheck className="ml-2 h-4 w-4" /> الصلاحيات
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditClick(role)}
                                  className="text-right"
                                >
                                  <Edit className="ml-2 h-4 w-4" /> {t('settings.userManagement.editPermissions')}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                            {t('settings.userManagement.noCustomRoles')}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-right">{t('settings.userManagement.editRole')}</DialogTitle>
            <DialogDescription className="text-right">
              {t('settings.userManagement.editRoleDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <Form {...editForm}>
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">{t('settings.userManagement.roleName')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('settings.userManagement.roleNamePlaceholder')} className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right">{t('settings.userManagement.description')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('settings.userManagement.descriptionPlaceholder')} className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Form>
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="text-right">
                {isSubmitting && <Loader2 className="animate-spin" />}
                {isSubmitting ? t('common.saving') : t('settings.userManagement.saveRole')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right flex items-center gap-2 justify-end">
              <ShieldCheck className="h-5 w-5 text-sky-600" />
              تعديل صلاحيات: {selectedRole?.name}
            </DialogTitle>
            <DialogDescription className="text-right">
              حدد الصلاحيات المسموح بها لهذا الدور
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {permissionCategories.map((category) => (
              <div key={category.key} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 p-3 cursor-pointer hover:bg-slate-100" onClick={() => toggleCategoryPermissions(category.key)}>
                  <div className="flex items-center gap-2 text-right flex-1">
                    <span className="text-lg">{category.icon}</span>
                    <span className="font-semibold text-slate-900">{category.label}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {category.permissions.filter(p => selectedPermissions.includes(p.id)).length} / {category.permissions.length}
                  </Badge>
                </div>

                <div className="p-3 space-y-2">
                  {category.permissions.map((permission) => (
                    <label key={permission.id} className="flex items-center gap-3 p-2 rounded hover:bg-slate-50 cursor-pointer text-right">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => togglePermission(permission.id)}
                        className="rounded border-slate-300"
                      />
                      <span className="flex-1 text-sm text-slate-700">{permission.label}</span>
                      {selectedPermissions.includes(permission.id) && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4 flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPermissionsDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button
              onClick={savePermissions}
              disabled={isSubmitting}
              className="btn-gradient btn-click-effect"
            >
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الصلاحيات'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
