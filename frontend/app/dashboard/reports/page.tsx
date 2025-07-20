"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, AlertCircle, Loader2, Filter, Search, SortDesc, Upload, ChevronDown, X, MoreVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { getReports, GetReportsOptions, deleteReport, checkReportStatus } from "@/lib/api";
import { Report } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState<GetReportsOptions['status']>();
  const [sortBy, setSortBy] = useState<GetReportsOptions['sortBy']>('uploadedAt');
  const [sortOrder, setSortOrder] = useState<GetReportsOptions['sortOrder']>('desc');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [previousReports, setPreviousReports] = useState<Record<string, string>>({});
  const [pendingReportId, setPendingReportId] = useState<string | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchReports() {
      try {
        if (!searchQuery) {
          setLoading(true);
        }
        setError(null);
        const data = await getReports({
          search: searchQuery || undefined,
          status,
          sortBy,
          sortOrder
        });
        
        // Check for reports that have changed status to COMPLETED
        if (reports.length > 0) {
          const newlyCompletedReports = data.filter((report: Report) => 
            report.status === 'COMPLETED' && 
            previousReports[report.id] && 
            previousReports[report.id] !== 'COMPLETED'
          );
          
          // Show notification for each newly completed report
          newlyCompletedReports.forEach((report: Report) => {
            toast.success(`Report "${report.name}" analysis completed!`, {
              description: 'Your report has been analyzed and is ready to view.',
              action: {
                label: 'View Report',
                onClick: () => router.push(`/dashboard/reports/${report.id}`)
              },
              duration: 10000, // Show for 10 seconds
            });
          });
        }
        
        // Update previous reports status
        const reportStatusMap = data.reduce((acc: Record<string, string>, report: Report) => {
          acc[report.id] = report.status;
          return acc;
        }, {});
        setPreviousReports(reportStatusMap);
        
        setReports(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch reports');
        toast.error('Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchReports, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, status, sortBy, sortOrder, reports.length, router]);

  // Check for pending reports in localStorage
  useEffect(() => {
    const storedPendingReportId = typeof window !== 'undefined' ? localStorage.getItem('pendingReportId') : null;
    if (storedPendingReportId) {
      setPendingReportId(storedPendingReportId);
    }

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, []);

  // Set up polling for pending report status
  useEffect(() => {
    if (!pendingReportId) return;
    
    // Clear any existing interval
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }

    // Set up polling every 5 seconds
    const interval = setInterval(async () => {
      try {
        const statusResult = await checkReportStatus(pendingReportId);
        
        if (statusResult.isCompleted) {
          // Report is completed, show notification
          const reportName = localStorage.getItem('pendingReportName') || 'Report';
          
          toast.success(`Report "${reportName}" analysis completed!`, {
            id: 'report-completed',
            description: 'Your report has been analyzed and is ready to view.',
            action: {
              label: 'View Report',
              onClick: () => {
                router.push(`/dashboard/reports/${pendingReportId}`);
              }
            },
            duration: 0, // Don't auto-dismiss
          });
          
          // Clear localStorage and interval
          localStorage.removeItem('pendingReportId');
          localStorage.removeItem('pendingReportName');
          clearInterval(interval);
          setStatusCheckInterval(null);
          setPendingReportId(null);
        } else if (statusResult.status === 'FAILED') {
          // Report processing failed
          const reportName = localStorage.getItem('pendingReportName') || 'Report';
          
          toast.error(`Report "${reportName}" analysis failed`, {
            id: 'report-failed',
            description: 'There was an error analyzing your report.',
            duration: 0, // Don't auto-dismiss
          });
          
          // Clear localStorage and interval
          localStorage.removeItem('pendingReportId');
          localStorage.removeItem('pendingReportName');
          clearInterval(interval);
          setStatusCheckInterval(null);
          setPendingReportId(null);
        }
      } catch (err) {
        // Error handling without logging
      }
    }, 5000); // Check every 5 seconds
    
    setStatusCheckInterval(interval);
  }, [pendingReportId, router]);

  const handleSort = (newSortBy: GetReportsOptions['sortBy']) => {
    if (sortBy === newSortBy) {
      // Toggle order if clicking the same field
      setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  const handleStatusFilter = (newStatus: GetReportsOptions['status']) => {
    setStatus(current => current === newStatus ? undefined : newStatus);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatus(undefined);
    setSortBy('uploadedAt');
    setSortOrder('desc');
    // Focus back on search input after clearing
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleDeleteClick = (reportId: string) => {
    setDeleteReportId(reportId);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!deleteReportId) return;
    
    try {
      setIsDeleting(true);
      await deleteReport(deleteReportId);
      
      // Update the reports list by filtering out the deleted report
      setReports(reports.filter(report => report.id !== deleteReportId));
      
      toast.success("Report deleted successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("Failed to delete report");
    } finally {
      setIsDeleting(false);
      setDeleteReportId(null);
    }
  };

  if (loading && !searchQuery) {
    return (
      <>
        <DashboardHeader 
          heading="ESG Reports"
          text="View and manage all your ESG compliance reports."
        >
          <Button asChild>
            <Link href="/dashboard/upload">Upload New Report</Link>
          </Button>
        </DashboardHeader>
        
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded-md w-full max-w-md"></div>
              <div className="flex gap-2">
                <div className="h-9 bg-muted rounded-md w-24"></div>
                <div className="h-9 bg-muted rounded-md w-24"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex justify-between">
                    <div className="space-y-2">
                      <div className="h-5 bg-muted rounded-md w-48"></div>
                      <div className="h-4 bg-muted rounded-md w-64"></div>
                    </div>
                    <div className="h-6 bg-muted rounded-full w-24"></div>
                  </div>
                  <div className="pt-4 border-t grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded-md w-16 mx-auto"></div>
                      <div className="h-4 bg-muted rounded-md w-24 mx-auto"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded-md w-16 mx-auto"></div>
                      <div className="h-4 bg-muted rounded-md w-24 mx-auto"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-8 bg-muted rounded-md w-16 mx-auto"></div>
                      <div className="h-4 bg-muted rounded-md w-24 mx-auto"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader 
          heading="ESG Reports"
          text="View and manage all your ESG compliance reports."
        >
          <Button asChild>
            <Link href="/dashboard/upload">Upload New Report</Link>
          </Button>
        </DashboardHeader>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-3 max-w-md">
              <p className="text-lg font-medium text-destructive">Error Loading Reports</p>
              <p className="text-muted-foreground">{error}</p>
              <Button 
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  getReports({
                    search: searchQuery || undefined,
                    status,
                    sortBy,
                    sortOrder
                  })
                    .then(data => setReports(data))
                    .catch(err => {
                      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
                      toast.error('Failed to fetch reports');
                    })
                    .finally(() => setLoading(false));
                }}
                className="mt-4"
              >
                <Loader2 className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <DashboardHeader 
        heading="ESG Reports"
        text="View and manage all your ESG compliance reports analyzed by Reggie."
      >
        <Button asChild>
          <Link href="/dashboard/upload">Upload New Report</Link>
        </Button>
      </DashboardHeader>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="search" className="text-sm font-medium">
                Search Reports
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  ref={searchInputRef}
                  placeholder="Search by report name or content..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("gap-1", status && "bg-primary/10 border-primary/40")}>
                    <Filter className="h-4 w-4" />
                    Filter
                    {status && <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">{status.toLowerCase().replace('_', ' ')}</Badge>}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => handleStatusFilter('COMPLETED')}
                    className={cn(status === 'COMPLETED' && "bg-accent")}
                  >
                    Completed
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusFilter('IN_PROGRESS')}
                    className={cn(status === 'IN_PROGRESS' && "bg-accent")}
                  >
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusFilter('PENDING')}
                    className={cn(status === 'PENDING' && "bg-accent")}
                  >
                    Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleStatusFilter('FAILED')}
                    className={cn(status === 'FAILED' && "bg-accent")}
                  >
                    Failed
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1">
                    <SortDesc className="h-4 w-4" />
                    Sort
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => handleSort('name')}
                    className={cn(sortBy === 'name' && "bg-accent")}
                  >
                    Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSort('uploadedAt')}
                    className={cn(sortBy === 'uploadedAt' && "bg-accent")}
                  >
                    Date {sortBy === 'uploadedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSort('status')}
                    className={cn(sortBy === 'status' && "bg-accent")}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {(searchQuery || status || sortBy !== 'uploadedAt' || sortOrder !== 'desc') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearFilters}
                  className="gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
            {searchQuery || status ? (
              <>
                <div className="text-center space-y-3 max-w-md">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-lg font-medium text-muted-foreground">No Matching Reports</p>
                  <p className="text-muted-foreground">
                    No reports found
                    {searchQuery && <> matching "<span className="font-medium">{searchQuery}</span>"</>}
                    {status && <> with status "<span className="font-medium">{status.toLowerCase().replace('_', ' ')}</span>"</>}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={clearFilters}
                    className="mt-4"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-3 max-w-md">
                  <p className="text-lg font-medium text-muted-foreground">No Reports Yet</p>
                  <p className="text-muted-foreground">
                    You haven't uploaded any ESG reports for Reggie to analyze yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Upload your first ESG report to get started with Reggie's compliance analysis
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/upload">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Report
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <Link href={`/dashboard/reports/${report.id}`} className="hover:underline">
                      <h3 className="text-lg font-medium">{report.name}</h3>
                    </Link>
                    <p className="text-sm text-muted-foreground">{report.description || "No description provided"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "capitalize",
                        report.status === 'COMPLETED' && "bg-green-100 text-green-800",
                        report.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-800",
                        report.status === 'PENDING' && "bg-amber-100 text-amber-800",
                        report.status === 'FAILED' && "bg-red-100 text-red-800"
                      )}
                    >
                      {report.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/reports/${report.id}`}>
                            View Report
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDeleteClick(report.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {report.results?.overallScore ? `${report.results.overallScore}%` : 
                       report.results?.score ? `${report.results.score}%` : "N/A"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Compliance Score</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {report.results?.findings?.reduce((total, finding) => 
                        total + (finding.issues?.length || 0), 0) || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Issues Found</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {report.standards?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Standards</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}