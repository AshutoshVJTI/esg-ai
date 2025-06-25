"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSharedReport } from "@/lib/api";
import { Report } from "@/lib/types";
import { ReportViewer } from "@/components/dashboard/report-viewer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SharedReportPage() {
  const { token } = useParams();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await getSharedReport(token as string);
        setReport(data);
      } catch (err) {
        console.error("Failed to fetch shared report:", err);
        setError("This shared report link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchReport();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[600px] w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load the shared report."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{report.name}</CardTitle>
          <CardDescription>{report.description}</CardDescription>
        </CardHeader>
      </Card>
      
      <ReportViewer reportId={report.id} />
    </div>
  );
} 