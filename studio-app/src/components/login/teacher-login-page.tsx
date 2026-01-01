"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function TeacherLoginPage() {
  const [teacherId, setTeacherId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with real authentication logic
    if (!teacherId || !password) {
      setError('يرجى إدخال جميع البيانات');
      return;
    }
    setError('');
    // Redirect to dashboard (simulate)
    window.location.href = '/teacher/dashboard';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">تسجيل دخول الأستاذ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="teacher-login-id" className="sr-only">رقم الأستاذ أو البريد الإلكتروني</label>
              <Input
                id="teacher-login-id"
                name="teacherId"
                placeholder="رقم الأستاذ أو البريد الإلكتروني"
                value={teacherId}
                onChange={e => setTeacherId(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="teacher-login-password" className="sr-only">كلمة المرور</label>
              <Input
                id="teacher-login-password"
                name="password"
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <Button type="submit" className="w-full">دخول</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
