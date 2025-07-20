import { DashboardHeader } from "@/components/dashboard/header";
import { UploadCard } from "@/components/dashboard/upload-card";
import { RecentReports } from "@/components/dashboard/recent-reports";
import { ComplianceOverview } from "@/components/dashboard/compliance-overview";

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader 
        heading="ESG Compliance Dashboard"
        text="Upload your ESG reports and let Reggie analyze them against popular standards."
      />
      
      <div className="grid gap-6 md:grid-cols-2">
        <UploadCard />
        <ComplianceOverview />
      </div>
      
      <div className="mt-6">
        <RecentReports />
      </div>
    </>
  );
}