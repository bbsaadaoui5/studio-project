"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { validateParentAccessToken } from "@/services/parentService";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/translation-provider";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Download, Trash2, Upload } from "lucide-react";
import { storage } from "@/lib/firebase-client";
import { ref, uploadBytesResumable, getDownloadURL, listAll, deleteObject } from "firebase/storage";

type StorageFile = {
  name: string;
  fullPath: string;
  url?: string;
};

export default function ParentFilesPage() {
  const { t } = useTranslation();
  const params = useParams();
  const token = params?.token as string | undefined;
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const listStudentFiles = async (studentId: string) => {
    try {
      if (!storage) throw new Error("Storage not initialized");
      const base = `students/${studentId}/files`;
      const listRef = ref(storage as any, base);
      const res = await listAll(listRef);
      const items = await Promise.all(res.items.map(async (it) => {
        const url = await getDownloadURL(it);
        return { name: it.name, fullPath: it.fullPath, url } as StorageFile;
      }));
      setFiles(items);
    } catch (err) {
      console.warn("Failed to list files", err);
      setFiles([]);
    }
  };

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
        await listStudentFiles(studentId);
      } catch (err) {
        console.error(err);
        toast({ title: t('common.error'), description: t('files.fetchError') || 'Failed to load files.', variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [token, toast, t]);

  const handleUpload = async () => {
  if (!fileRef.current || !fileRef.current.files || fileRef.current.files.length === 0) {
  toast({ title: t('files.chooseFileTitle') || 'Choose file', description: t('files.chooseFileDesc') || 'Please select a file to upload.', variant: "destructive" });
      return;
    }
    if (!token) return;
    setUploading(true);
    setProgress(0);
    try {
      const studentId = await validateParentAccessToken(token);
      if (!studentId) {
        toast({ title: t('unauthorized.title'), description: t('unauthorized.description'), variant: "destructive" });
        return;
      }

      const file = fileRef.current.files[0];
      const path = `students/${studentId}/files/${Date.now()}_${file.name}`;
      const storageRef = ref(storage as any, path);
      const task = uploadBytesResumable(storageRef, file);
      task.on('state_changed', (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      });
      await task;
  toast({ title: t('files.uploadedTitle') || 'Uploaded', description: t('files.uploadedDesc', { name: file.name }) || `${file.name} uploaded successfully.` });
      await listStudentFiles(studentId);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      console.error(err);
      toast({ title: t('common.error'), description: t('files.uploadError') || 'Failed to upload file.', variant: "destructive" });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (fullPath: string) => {
    if (!token) return;
      try {
      const studentId = await validateParentAccessToken(token);
      if (!studentId) return;
      const objRef = ref(storage as any, fullPath);
      await deleteObject(objRef);
      toast({ title: t('files.deletedTitle') || 'Deleted', description: t('files.deletedDesc') || 'File deleted.' });
      await listStudentFiles(studentId);
    } catch (err) {
      console.error(err);
      toast({ title: t('common.error'), description: t('files.deleteError') || 'Failed to delete file.', variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t('files.title')}</h1>
      </header>

      <main>
        <Card className="mb-6">
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="flex-1">
                <Label>{t('files.uploadLabel')}</Label>
                <Input type="file" ref={fileRef} />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleUpload} disabled={uploading}>
                  {uploading ? <Loader2 className="animate-spin mr-2" /> : <Upload className="mr-2" />} {t('files.upload')}
                </Button>
                {uploading && <div className="text-sm">{progress}%</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('files.listTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : files.length === 0 ? (
              <p className="text-muted-foreground">{t('files.noFiles')}</p>
            ) : (
              <ul className="space-y-3">
                {files.map(f => (
                  <li key={f.fullPath} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <a href={f.url} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground">{t('files.openDownload')}</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={f.url} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm"><Download /></Button>
                      </a>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(f.fullPath)}><Trash2 /></Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
