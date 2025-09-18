'use client';

import { useEffect } from 'react';
import { initializeClientSideServices } from '@/lib/firebase-client';

export function FirebaseInitializer() {
  useEffect(() => {
    initializeClientSideServices();
  }, []);
  return null;
}