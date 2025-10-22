
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { getRoles, addRole, type Role } from "@/services/roleService";
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
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<z.infer<typeof roleSchema>>({
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
        fetchRoles(); // Refresh the list
        form.reset();
        setIsDialogOpen(false);
    } catch (error) {
        toast({ title: t('common.error'), description: t('settings.userManagement.failedToCreateRole'), variant: "destructive"});
    } finally {
        setIsSubmitting(false);
    }
  }


  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle className="text-right">{t('settings.userManagement.userRolesPermissions')}</CardTitle>
            <CardDescription className="text-right">
                {t('settings.userManagement.defineRolesDescription')}
            </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="text-right">
                <PlusCircle className="ml-2" /> {t('settings.userManagement.addNewRole')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-right">{t('settings.userManagement.createNewRole')}</DialogTitle>
              <DialogDescription className="text-right">
                {t('settings.userManagement.createRoleDescription')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
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
                        control={form.control}
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
                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={isSubmitting} className="text-right">
                            {isSubmitting && <Loader2 className="animate-spin" />}
                            {isSubmitting ? t('common.saving') : t('settings.userManagement.saveRole')}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">{t('settings.userManagement.role')}</TableHead>
                        <TableHead className="text-right">{t('settings.userManagement.description')}</TableHead>
                        <TableHead className="text-right">{t('settings.userManagement.users')}</TableHead>
                        <TableHead className="text-right">{t('common.actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {roles.length > 0 ? (
                        roles.map(role => (
                            <TableRow key={role.id}>
                                <TableCell className="font-medium text-right">{role.name}</TableCell>
                                <TableCell className="text-muted-foreground text-right">{role.description}</TableCell>
                                <TableCell className="text-right">
                                    <Badge variant="secondary">{t('settings.userManagement.usersCount', { count: role.userCount })}</Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" disabled className="text-right">
                                        <Edit className="ml-2 h-4 w-4" /> {t('settings.userManagement.editPermissions')}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                                {t('settings.userManagement.noCustomRoles')}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        )}
      </CardContent>
    </Card>
  );
}
