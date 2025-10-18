"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ContactAdminPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <p>If you need to contact the system administrator, please open a support ticket or email support@example.com.</p>
        </CardContent>
      </Card>
    </div>
  );
}
