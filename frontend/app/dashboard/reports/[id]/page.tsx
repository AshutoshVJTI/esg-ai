"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportViewer } from "@/components/dashboard/report-viewer";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { getReport } from "@/lib/api";
import { notFound } from "next/navigation";
import { ReportActions } from "@/components/dashboard/report-actions";

interface ReportPageProps {
  params: {
    id: string;
  };
}

// Enable server-side rendering for dynamic data
export const dynamic = 'force-dynamic';

async function getReportData(id: string) {
  try {
    const report = await getReport(id);
    if (!report) {
      return null;
    }
    return report;
  } catch (error) {
    console.error('Error fetching report:', error);
    return null;
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = params;
  const report = await getReportData(id);
  
  if (!report) {
    notFound();
  }

  // Use reportName from results if available, otherwise use the report name
  const reportName = report.results?.reportName || report.name;
  // Use summary from results if available
  const description = report.results?.summary || report.description || "AI-powered ESG compliance analysis";

  return (
    <>
      <DashboardHeader 
        heading={reportName}
        text={description}
      >
        <ReportActions reportId={id} />
      </DashboardHeader>
      
      <ReportViewer reportId={id} />
    </>
  );
}