import ParentDashboardClient from '@/components/parent/ParentDashboardClient';

export const dynamic = 'force-dynamic';

export default function ParentDashboardPage() {
  return (
    <>
      {/* Server-rendered heading (sr-only for accessibility) */}
      <h1 className="sr-only">لوحة الوالد</h1>
      <ParentDashboardClient />
    </>
  );
}
