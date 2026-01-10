import { ReactNode } from "react";
import { AppSidebar } from "./Sidebar";
import { AIChat } from "./AIChat";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <header className="flex h-14 sm:h-16 items-center gap-2 border-b px-3 sm:px-6">
            <SidebarTrigger />
            <h2 className="text-lg sm:text-xl font-semibold">MindMate</h2>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
        <AIChat />
      </div>
    </SidebarProvider>
  );
};
