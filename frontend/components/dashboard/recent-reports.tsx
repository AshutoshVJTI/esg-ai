"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, AlertCircle, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { getReports } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Report } from "@/lib/types";

export function RecentReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports();
      setReports(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Loading your reports...</p>
              <p className="text-xs text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="space-y-2">
              <p className="text-sm text-destructive font-medium">Error loading reports</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button 
              onClick={fetchReports}
              variant="outline"
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reports</CardTitle>
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Upload className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="font-medium text-muted-foreground">No reports yet</p>
              <p className="text-sm text-muted-foreground">
                Upload your first ESG report to get started with compliance analysis
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Report
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Link 
                key={report.id} 
                href={`/dashboard/reports/${report.id}`}
                className="block"
              >
                <div className="border rounded-lg p-4 hover:border-primary hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{report.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Uploaded {new Date(report.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge
                      variant={
                        report.status === 'COMPLETED'
                          ? 'default'
                          : report.status === 'IN_PROGRESS'
                          ? 'secondary'
                          : report.status === 'FAILED'
                          ? 'destructive'
                          : 'outline'
                      }
                      className={cn(
                        "capitalize",
                        report.status === 'COMPLETED' && "bg-green-100 text-green-800 hover:bg-green-100",
                        report.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-800 hover:bg-blue-100",
                        report.status === 'FAILED' && "bg-red-100 text-red-800 hover:bg-red-100"
                      )}
                    >
                      {report.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  {report.results && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {report.results.overallScore ?? report.results.score ?? 'N/A'}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Overall Score
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {report.results.findings?.reduce((total, finding) => total + (finding.issues?.length ?? 0), 0) ?? 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Issues Found
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {report.standards?.length ?? 0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Standards
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}