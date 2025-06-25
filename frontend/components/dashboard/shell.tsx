"use client";

import { useState } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { Chat } from "@/components/dashboard/chat";

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-background border-r">
          <div className="flex items-center justify-between p-4">
            <span className="font-bold">ESG Checker</span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Sidebar />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r">
        <div className="flex flex-col flex-1 h-full">
          <div className="flex items-center justify-between p-4">
            <span className="font-bold">ESG Checker</span>
            <ModeToggle />
          </div>
          <Sidebar />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Chat component */}
      <Chat />
    </div>
  );
}