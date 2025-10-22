import React from 'react';

export const dynamic = 'force-dynamic';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  // Server-rendered segment layout for /parent. Render a hidden H1 so
  // accessibility scanners and screen readers always find a level-one
  // heading on these pages (the client component may render later).
  return (
    <div>
      <h1 className="sr-only">لوحة الوالد</h1>
      {children}
    </div>
  );
}
