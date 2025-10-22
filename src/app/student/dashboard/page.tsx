import StudentDashboard from '@/components/dashboard/student-dashboard';
export default function Page() {
  return (
    <>
      {/* Ensure server-rendered page includes a level 1 heading for axe */}
      <h1 className="sr-only">لوحة طالب</h1>
      <StudentDashboard />
    </>
  );
}
