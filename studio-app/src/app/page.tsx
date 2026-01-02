'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function RootPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // If user is authenticated, redirect to dashboard
      if (user) {
        router.push('/dashboard');
      } else {
        // If not authenticated, redirect to login
        router.push('/(auth)/login');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">جاري التحقق...</p>
      </div>
    </div>
  );
}