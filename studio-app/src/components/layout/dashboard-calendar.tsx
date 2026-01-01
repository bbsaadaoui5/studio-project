
"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";


export function DashboardCalendar() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
    setDate(new Date());
  }, []);

  // By returning a Skeleton when not on the client, we ensure the server-render
  // and initial client-render match, preventing a hydration error.
  if (!isClient) {
    return <Skeleton className="h-[298px] w-[320px] rounded-md" />;
  }

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="rounded-md border"
    />
  );
}
