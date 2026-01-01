"use client";
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function StudentLoginPage() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Replace with real authentication logic
    if (!studentId || !password) {
      setError('يرجى إدخال جميع البيانات');
      return;
    }
    setError('');
    // Redirect to dashboard (simulate)
    window.location.href = '/student/dashboard';
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center">تسجيل دخول الطالب</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="student-login-id" className="sr-only">رقم الطالب أو البريد الإلكتروني</label>
              <Input
                id="student-login-id"
                name="studentId"
                placeholder="رقم الطالب أو البريد الإلكتروني"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="student-login-password" className="sr-only">كلمة المرور</label>
              <Input
                id="student-login-password"
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
