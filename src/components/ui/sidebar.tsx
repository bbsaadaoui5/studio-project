
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  LayoutDashboard,
  GraduationCap,
  Users,
  Briefcase,
  BookOpen,
  MessageSquare,
  FileText,
  Landmark,
  Settings,
  Menu,
  X,
  BookCopy,
  PenSquare,
  CalendarDays,
  Library,
  Contact,
  UserPlus,
  BookOpenCheck,
  Users2,
  ClipboardList,
  CalendarCheck,
  Wallet,
  Star,
  CalendarPlus,
  ClipboardCheck,
  NotebookText,
  Megaphone,
  Archive,
  Receipt,
  TrendingDown,
  BarChart,
  UserSquare,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

// -----------------------------
// Sidebar Context & Provider
// -----------------------------

type SidebarContextType = {
  isOpen: boolean;
  isMounted: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const toggle = () => {
    setIsOpen(!isOpen);
  };

  React.useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ isOpen, isMounted, setIsOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within a SidebarProvider");
  return context;
};

// -----------------------------
// Sidebar Menu Items
// -----------------------------

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Student Management",
    icon: Users,
    subMenus: [
      { label: "Student Directory", href: "/student-management/directory", icon: Contact },
      { label: "Admissions", href: "/student-management/admissions", icon: UserPlus },
    ],
  },
   {
    label: "Staff & Instructors",
    icon: Briefcase,
    subMenus: [
      { label: "Staff Directory", href: "/staff-management/directory", icon: Contact },
      { label: "Payroll", href: "/staff-management/payroll", icon: Wallet },
      { label: "Attendance", href: "/staff-management/attendance", icon: CalendarCheck },
      { label: "Reviews", href: "/staff-management/reviews", icon: Star },
    ],
  },
   {
    label: "Support Programs",
    icon: UserSquare,
    subMenus: [
      { label: "Instructors", href: "/support-programs/instructors", icon: Contact },
      { label: "Students", href: "/support-programs/students", icon: Users2 },
      { label: "Courses", href: "/support-programs/courses", icon: BookCopy },
    ],
  },
  {
    label: "Academic Management",
    icon: GraduationCap,
    subMenus: [
      { label: "Courses", href: "/academic-management/courses", icon: BookOpenCheck },
      { label: "Classes", href: "/academic-management/classes", icon: Users2 },
      { label: "Enrollment", href: "/academic-management/enrollment", icon: ClipboardList },
      { label: "Attendance", href: "/academic-management/attendance", icon: CalendarCheck },
      { label: "Timetable", href: "/academic-management/timetable", icon: CalendarDays },
    ],
  },
  {
    label: "Examination",
    icon: BookOpen,
    subMenus: [
      { label: "Exam Schedule", href: "/examination/exams", icon: CalendarPlus },
      { label: "Exam Results", href: "/examination/results", icon: ClipboardCheck },
      { label: "Gradebook", href: "/examination/gradebook", icon: NotebookText },
      { label: "Report Cards", href: "/examination/report-cards", icon: FileText },
    ],
  },
    {
    label: "Events",
    href: "/events/calendar",
    icon: CalendarDays,
  },
  {
    label: "Communication",
    icon: MessageSquare,
    subMenus: [
      { label: "Announcements", href: "/communication/announcements", icon: Megaphone },
      { label: "Messages", href: "/communication/messages", icon: MessageSquare },
    ],
  },
  {
    label: "Resources",
    icon: Library,
    subMenus: [
      { label: "Library", href: "/resources/library", icon: Library },
      { label: "Inventory", href: "/resources/inventory", icon: Archive },
    ],
  },
  {
    label: "Finance",
    icon: Landmark,
    subMenus: [
      { label: "Fees", href: "/finance/fees", icon: Receipt },
      { label: "Expenses", href: "/finance/expenses", icon: TrendingDown },
      { label: "Reports", href: "/finance/reports", icon: BarChart },
    ],
  },
];

const teacherMenuItems = [
  { label: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "Lesson Planner", href: "/teacher/lesson-planner", icon: PenSquare },
]

// -----------------------------
// Sidebar Components
// -----------------------------
const SidebarMenuButton = ({
  item,
  isSubmenu = false,
}: {
  item: { href: string; label: string; icon?: any };
  isSubmenu?: boolean;
}) => {
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const isActive = pathname === item.href;

  const buttonContent = (
    <div className="flex items-center gap-3">
      <item.icon />
      {isOpen && <span className="truncate">{item.label}</span>}
    </div>
  );

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn("w-full justify-start h-11", { "pl-8": isSubmenu && isOpen, "pl-2 justify-center": isSubmenu && !isOpen })}
      asChild
    >
      <Link href={item.href}>
        <div>
            {isOpen ? (
            buttonContent
            ) : (
            <TooltipProvider>
                <Tooltip>
                <TooltipTrigger asChild>
                    <div>{buttonContent}</div>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{item.label}</p>
                </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            )}
        </div>
      </Link>
    </Button>
  );
};

const SidebarMenuSubButton = ({
  item,
}: {
  item: { label: string; icon: any; subMenus: { href: string; label: string, icon: any }[] };
}) => {
  const { isOpen } = useSidebar();
  const pathname = usePathname();
  const isAnySubmenuActive = item.subMenus.some(
    (sm) => pathname.startsWith(sm.href)
  );

  const triggerContent = (
    <div className="flex items-center gap-3">
      <item.icon />
      {isOpen && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform duration-200", {
              "rotate-180": isAnySubmenuActive,
            })}
          />
        </>
      )}
    </div>
  );

  return (
    <Collapsible defaultOpen={isAnySubmenuActive}>
      <CollapsibleTrigger asChild>
        <Button
          variant={isAnySubmenuActive ? "secondary" : "ghost"}
          className="w-full justify-start h-11"
        >
          {isOpen ? (
            triggerContent
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <div>{triggerContent}</div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </Button>
      </CollapsibleTrigger>
      
        <CollapsibleContent className="space-y-1 py-1">
          {item.subMenus.map((submenu) => (
            <SidebarMenuButton
              key={submenu.label}
              item={submenu}
              isSubmenu
            />
          ))}
        </CollapsibleContent>
      
    </Collapsible>
  );
};

// -----------------------------
// AppSidebar Component
// -----------------------------

export const AppSidebar: React.FC = () => {
  const { isOpen, isMounted } = useSidebar();
  const currentMenuItems = menuItems;

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out",
        {
          "w-64": isOpen,
          "w-20": !isOpen,
        }
      )}
    >
      <div className={cn("flex h-16 items-center border-b border-sidebar-border px-6", { "justify-between": isOpen, "justify-center": !isOpen })}>
        <Link href="/" className="flex items-center gap-2 font-semibold">
           <div className="bg-background rounded-md p-1.5">
            <GraduationCap className="h-6 w-6 text-primary" />
           </div>
          {isOpen && <span className="truncate">CampusConnect</span>}
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        {isMounted && (
            <nav className="grid items-start gap-1 p-2">
              {currentMenuItems.map((item) =>
                item.subMenus ? (
                  <SidebarMenuSubButton key={item.label} item={item as any} />
                ) : (
                  <SidebarMenuButton key={item.label} item={item} />
                )
              )}
            </nav>
        )}
      </div>
       <div className="mt-auto flex items-center justify-between border-t border-sidebar-border p-4">
        {isOpen && (
            <Link href="/settings" className="flex items-center gap-2 text-sm hover:underline">
                <Settings />
                Settings
            </Link>
        )}
      </div>
    </div>
  );
};

// -----------------------------
// SidebarTrigger Component
// -----------------------------
export const SidebarTrigger: React.FC<{ className?: string }> = ({ className }) => {
  const { toggle, isOpen } = useSidebar();
  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
    >
      {isOpen ? <X /> : <Menu />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
};
