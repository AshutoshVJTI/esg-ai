"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  BarChart3, 
  FileText, 
  Home, 
  Upload, 
  CheckSquare, 
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
}

function SidebarItem({ href, icon, title }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full justify-start",
        isActive && "bg-muted font-medium"
      )}
    >
      <Link href={href} className="flex items-center gap-3 px-3 py-2">
        {icon}
        <span>{title}</span>
      </Link>
    </Button>
  );
}

export function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 py-4 space-y-1">
        <SidebarItem href="/dashboard" icon={<Home className="h-5 w-5" />} title="Dashboard" />
        <SidebarItem href="/dashboard/reports" icon={<FileText className="h-5 w-5" />} title="Reports" />
        <SidebarItem href="/dashboard/upload" icon={<Upload className="h-5 w-5" />} title="Upload" />
        <SidebarItem href="/dashboard/standards" icon={<CheckSquare className="h-5 w-5" />} title="Standards" />
        <SidebarItem href="/dashboard/analytics" icon={<BarChart3 className="h-5 w-5" />} title="Analytics" />
        <SidebarItem href="/dashboard/history" icon={<History className="h-5 w-5" />} title="History" />
      </div>
    </div>
  );
}