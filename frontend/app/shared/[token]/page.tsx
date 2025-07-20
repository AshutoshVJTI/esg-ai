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
import { Logo } from "@/components/ui/logo";

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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo variant="text" width={120} height={32} />
              <div className="text-sm text-muted-foreground">
                Shared Report
              </div>
            </div>
          </div>
        </header>

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
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Logo variant="text" width={120} height={32} />
              <div className="text-sm text-muted-foreground">
                Shared Report
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto py-10">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error || "Failed to load the shared report."}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Logo variant="text" width={120} height={32} />
            <div className="text-sm text-muted-foreground">
              Shared Report
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-10">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{report.name}</CardTitle>
            <CardDescription>{report.description}</CardDescription>
          </CardHeader>
        </Card>
        
        <ReportViewer reportId={report.id} />
      </div>
    </div>
  );
} 