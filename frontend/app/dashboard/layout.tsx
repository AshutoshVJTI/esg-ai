"use client";

import { DashboardShell } from "@/components/dashboard/shell";
import { ChatProvider } from "@/components/dashboard/chat-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatProvider>
      <DashboardShell>{children}</DashboardShell>
    </ChatProvider>
  );
} 