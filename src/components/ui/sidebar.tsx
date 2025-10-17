
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useTranslation } from "@/i18n/translation-provider";
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
    label: "navigation.dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "navigation.studentManagement",
    icon: Users,
    subMenus: [
      { label: "navigation.studentDirectory", href: "/student-management/directory", icon: Contact },
      { label: "navigation.admissions", href: "/student-management/admissions", icon: UserPlus },
    ],
  },
   {
    label: "navigation.staffInstructors",
    icon: Briefcase,
    subMenus: [
      { label: "navigation.staffDirectory", href: "/staff-management/directory", icon: Contact },
      { label: "navigation.payroll", href: "/staff-management/payroll", icon: Wallet },
      { label: "navigation.attendance", href: "/staff-management/attendance", icon: CalendarCheck },
      { label: "navigation.reviews", href: "/staff-management/reviews", icon: Star },
    ],
  },
   {
    label: "navigation.supportPrograms",
    icon: UserSquare,
    subMenus: [
      { label: "navigation.courses", href: "/support-programs/courses", icon: BookCopy },
    ],
  },
  {
    label: "navigation.academicManagement",
    icon: GraduationCap,
    subMenus: [
      { label: "navigation.courses", href: "/academic-management/courses", icon: BookOpenCheck },
      { label: "navigation.classes", href: "/academic-management/classes", icon: Users2 },
      { label: "navigation.enrollment", href: "/academic-management/enrollment", icon: ClipboardList },
      { label: "navigation.attendance", href: "/academic-management/attendance", icon: CalendarCheck },
      { label: "navigation.timetable", href: "/academic-management/timetable", icon: CalendarDays },
    ],
  },
  {
    label: "navigation.examination",
    icon: BookOpen,
    subMenus: [
      { label: "navigation.examSchedule", href: "/examination/exams", icon: CalendarPlus },
      { label: "navigation.examResults", href: "/examination/results", icon: ClipboardCheck },
      { label: "navigation.gradebook", href: "/examination/gradebook", icon: NotebookText },
      { label: "navigation.reportCards", href: "/examination/report-cards", icon: FileText },
    ],
  },
    {
    label: "navigation.events",
    href: "/events/calendar",
    icon: CalendarDays,
  },
  {
    label: "navigation.communication",
    icon: MessageSquare,
    subMenus: [
      { label: "navigation.announcements", href: "/communication/announcements", icon: Megaphone },
      { label: "navigation.messages", href: "/communication/messages", icon: MessageSquare },
    ],
  },
  {
    label: "navigation.resources",
    icon: Library,
    subMenus: [
      { label: "navigation.library", href: "/resources/library", icon: Library },
      { label: "navigation.inventory", href: "/resources/inventory", icon: Archive },
    ],
  },
  {
    label: "navigation.finance",
    icon: Landmark,
    subMenus: [
      { label: "navigation.fees", href: "/finance/fees", icon: Receipt },
      { label: "navigation.expenses", href: "/finance/expenses", icon: TrendingDown },
      { label: "navigation.reports", href: "/finance/reports", icon: BarChart },
    ],
  },
  {
    label: "navigation.reportsAnalytics",
    icon: BarChart,
    subMenus: [
      { label: "navigation.academicReports", href: "/reports", icon: BookOpen },
      { label: "navigation.financialReports", href: "/finance/reports", icon: Landmark },
    ],
  },
];

const teacherMenuItems = [
  { label: "navigation.dashboard", href: "/teacher/dashboard", icon: LayoutDashboard },
  { label: "navigation.lessonPlanner", href: "/teacher/lesson-planner", icon: PenSquare },
  {
    label: "navigation.myStudents",
    icon: Users2,
    submenu: [
      { label: "navigation.studentList", href: "/teacher/students", icon: Users },
      { label: "navigation.attendance", href: "/teacher/attendance", icon: ClipboardCheck },
      { label: "navigation.grades", href: "/teacher/grades", icon: Star },
    ],
  },
  {
    label: "navigation.assignments",
    icon: BookOpenCheck,
    submenu: [
      { label: "navigation.createAssignment", href: "/teacher/assignments/new", icon: UserPlus },
      { label: "navigation.manageAssignments", href: "/teacher/assignments", icon: ClipboardList },
      { label: "navigation.submissions", href: "/teacher/submissions", icon: FileText },
    ],
  },
  {
    label: "navigation.assessments",
    icon: NotebookText,
    submenu: [
      { label: "navigation.createTest", href: "/teacher/tests/new", icon: CalendarPlus },
      { label: "navigation.manageTests", href: "/teacher/tests", icon: CalendarCheck },
      { label: "navigation.gradeResults", href: "/teacher/results", icon: BarChart },
    ],
  },
  {
    label: "navigation.communication",
    icon: MessageSquare,
    submenu: [
      { label: "navigation.parentMessages", href: "/teacher/messages", icon: Megaphone },
      { label: "navigation.announcements", href: "/teacher/announcements", icon: Contact },
    ],
  },
  {
    label: "navigation.resources",
    icon: Library,
    submenu: [
      { label: "navigation.teachingMaterials", href: "/teacher/materials", icon: Archive },
      { label: "navigation.myLibrary", href: "/teacher/library", icon: BookCopy },
    ],
  },
  { label: "navigation.reports", href: "/teacher/reports", icon: TrendingDown },
  { label: "navigation.schedule", href: "/teacher/schedule", icon: CalendarDays },
]

// -----------------------------
// Sidebar Components
// -----------------------------
const SidebarMenuButton = ({
  item,
  isSubmenu = false,
}: {
  item: { href: string; label: string; icon?: React.ElementType };
  isSubmenu?: boolean;
}) => {
  const { isOpen } = useSidebar();
  const { t } = useTranslation();
  const pathname = usePathname();
  const isActive = pathname === item.href;

  const Icon = item.icon as React.ElementType | null;
  const buttonContent = (
    <div className="flex items-center gap-3">
      {Icon ? <Icon /> : null}
      {isOpen && <span className="truncate">{t(item.label)}</span>}
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
                  <div>
                    {buttonContent}
                    {/* screen reader only label for collapsed sidebar icon buttons */}
                    <span className="sr-only">{t(item.label) || item.label}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{t(item.label)}</p>
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
  item: { label: string; icon: React.ElementType; subMenus: { href: string; label: string, icon: React.ElementType }[] };
}) => {
  const { isOpen } = useSidebar();
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentPath = pathname ?? '';
  const isAnySubmenuActive = item.subMenus.some((sm) => currentPath.startsWith(sm.href));

  const Icon = item.icon as React.ElementType | null;
  const triggerContent = (
    <div className="flex items-center gap-3">
      {Icon ? <Icon /> : null}
      {isOpen && (
        <>
          <span className="flex-1 truncate">{t(item.label)}</span>
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
                  <p>{t(item.label)}</p>
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
  const { t } = useTranslation();

  const getMenuItems = () => [
    {
      label: t("navigation.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: t("navigation.students"),
      icon: Users,
      subMenus: [
        { label: t("students.directory"), href: "/student-management/directory", icon: Contact },
        { label: t("students.admissions"), href: "/student-management/admissions", icon: UserPlus },
      ],
    },
    {
      label: t("navigation.staff"),
      icon: Briefcase,
      subMenus: [
  { label: t("navigation.staffDirectory"), href: "/staff-management/directory", icon: Contact },
  { label: t("navigation.payroll"), href: "/staff-management/payroll", icon: Wallet },
  { label: t("navigation.attendance"), href: "/staff-management/attendance", icon: CalendarCheck },
  { label: t("navigation.reviews"), href: "/staff-management/reviews", icon: Star },
      ],
    },
    {
      label: t("support.title"),
      icon: UserSquare,
      subMenus: [
        { label: t("support.courses"), href: "/support-programs/courses", icon: BookCopy },
      ],
    },
    {
      label: t("academics.title"),
      icon: GraduationCap,
      subMenus: [
        { label: t("academics.courses"), href: "/academic-management/courses", icon: BookOpenCheck },
        { label: t("academics.classes"), href: "/academic-management/classes", icon: Users2 },
        { label: t("academics.enrollment"), href: "/academic-management/enrollment", icon: ClipboardList },
        { label: t("academics.attendance"), href: "/academic-management/attendance", icon: CalendarCheck },
      ],
    },
    {
      label: t("examination.title"),
      icon: BookOpen,
      subMenus: [
        { label: t("examination.exams"), href: "/examination/exams", icon: CalendarPlus },
        { label: t("examination.results"), href: "/examination/results", icon: ClipboardCheck },
        { label: t("examination.gradebook"), href: "/examination/gradebook", icon: NotebookText },
        { label: t("examination.reportCards"), href: "/examination/report-cards", icon: FileText },
      ],
    },
    {
      label: t("events.title"),
      href: "/events/calendar",
      icon: CalendarDays,
    },
    {
      label: t("communication.title"),
      icon: MessageSquare,
      subMenus: [
        { label: t("communication.announcements"), href: "/communication/announcements", icon: Megaphone },
        { label: t("communication.messages"), href: "/communication/messages", icon: MessageSquare },
      ],
    },
    {
      label: t("resources.title"),
      icon: Archive,
      subMenus: [
        { label: t("resources.library"), href: "/resources/library", icon: Library },
        { label: t("resources.inventory"), href: "/resources/inventory", icon: Archive },
      ],
    },
    {
      label: t("finance.title"),
      icon: Landmark,
      subMenus: [
        { label: t("finance.fees"), href: "/finance/fees", icon: Receipt },
        { label: t("finance.expenses"), href: "/finance/expenses", icon: TrendingDown },
        { label: t("finance.reports"), href: "/finance/reports", icon: BarChart },
      ],
    },
    {
      label: t("navigation.reports"),
      href: "/reports",
      icon: FileText,
    },
  ];

  const currentMenuItems = getMenuItems();

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
            {/* Logo is decorative when followed by visible text; set empty alt and aria-hidden
                to avoid duplicate accessible name reports from axe. */}
            <Image src="/icon-192.png" alt="" aria-hidden className="h-8 w-8" width={32} height={32} />
          {isOpen && <span className="truncate">{t('app.name')}</span>}
        </Link>
      </div>
      <div className="flex-1 overflow-auto">
        {isMounted && (
            <nav className="grid items-start gap-1 p-2">
              {currentMenuItems.map((item) =>
                item.subMenus ? (
                  <SidebarMenuSubButton key={item.label} item={item as { label: string; icon: React.ElementType; subMenus: { href: string; label: string; icon: React.ElementType }[] }} />
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
                {t("navigation.settings")}
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
  const { t } = useTranslation();
  return (
    <Button
      onClick={toggle}
      variant="ghost"
      size="icon"
      className={cn("rounded-full", className)}
    >
      {isOpen ? <X /> : <Menu />}
      <span className="sr-only">{t("navigation.toggleSidebar") || 'Toggle sidebar'}</span>
    </Button>
  );
};
