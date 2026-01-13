
"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { getEvents } from "@/services/eventService";
import { getAnnouncementsByStatus } from "@/services/announcementService";
import type { SchoolEvent, Announcement } from "@/lib/types";


export function DashboardCalendar() {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    setIsClient(true);
    setDate(new Date());
    
    // Load events and announcements
    const fetchData = async () => {
      try {
        const [fetchedEvents, activeAnnouncements, scheduledAnnouncements] = await Promise.all([
          getEvents(),
          getAnnouncementsByStatus("active"),
          getAnnouncementsByStatus("scheduled")
        ]);
        
        // Merge active + scheduled announcements
        const mergedAnnouncements = [...activeAnnouncements, ...scheduledAnnouncements].reduce<Record<string, Announcement>>((acc, a) => {
          acc[a.id] = a;
          return acc;
        }, {});
        
        setEvents(fetchedEvents);
        setAnnouncements(Object.values(mergedAnnouncements));
      } catch (error) {
        console.error("Error loading calendar data:", error);
      }
    };
    
    fetchData();
  }, []);

  const getEventsForDay = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    return events.filter(e => e.date === formattedDay);
  };

  const getAnnouncementsForDay = (day: Date) => {
    const formattedDay = format(day, "yyyy-MM-dd");
    return announcements.filter(a => {
      if (a.eventDate) {
        const eventDay = format(new Date(a.eventDate), "yyyy-MM-dd");
        return formattedDay === eventDay;
      }
      const publishDate = format(new Date(a.publishDate), "yyyy-MM-dd");
      const expiryDate = format(new Date(a.expiryDate), "yyyy-MM-dd");
      return formattedDay >= publishDate && formattedDay <= expiryDate;
    });
  };

  const categoryColors: Record<SchoolEvent['category'], string> = {
    holiday: 'bg-green-500',
    exam: 'bg-red-500',
    meeting: 'bg-blue-500',
    activity: 'bg-yellow-500'
  };

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
      components={{
        DayContent: ({ date }) => {
          const dayEvents = getEventsForDay(date);
          const dayAnnouncements = getAnnouncementsForDay(date);
          const totalItems = dayEvents.length + dayAnnouncements.length;
          return (
            <div className="relative h-full w-full">
              <span className="relative z-10">{format(date, 'd')}</span>
              {totalItems > 0 && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1 z-0">
                  {dayEvents.slice(0, 2).map((e, index) => (
                    <div key={`${e.id}-${index}`} className={`h-1.5 w-1.5 rounded-full ${categoryColors[e.category]}`}></div>
                  ))}
                  {dayAnnouncements.length > 0 && (
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                  )}
                </div>
              )}
            </div>
          );
        },
      }}
    />
  );
}
