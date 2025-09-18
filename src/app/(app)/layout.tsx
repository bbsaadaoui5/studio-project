import type { ReactNode } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from 'react';

export default function AppLayout({ 
  children
}: { 
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <div className="no-print">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="no-print">
            <Header />
          </div>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            <Suspense fallback={<div>Loading content...</div>}> 
              {children}
            </Suspense>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}