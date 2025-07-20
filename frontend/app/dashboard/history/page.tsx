'use client';

import { useState, useEffect } from 'react';
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ArrowUpDown, Filter, Calendar, Download, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { getActivities, exportActivities, Activity, GetActivitiesOptions } from "@/lib/api";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { DatePickerWithRange } from "@/components/date-picker-with-range";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

export default function HistoryPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [type, setType] = useState<string | undefined>();
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Fetch activities with filters
  useEffect(() => {
    async function fetchActivities() {
      try {
        setLoading(true);
        setError(null);
        
        const options: GetActivitiesOptions = {
          sortOrder,
          sortBy: 'createdAt'
        };
        
        // Apply type filter
        if (type) {
          options.type = type;
        }
        
        // Apply date range filter
        if (dateRange?.from) {
          options.startDate = dateRange.from;
        }
        
        if (dateRange?.to) {
          options.endDate = dateRange.to;
        }
        
        const data = await getActivities(options);
        setActivities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch activities');
        toast.error('Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    }
    
    fetchActivities();
  }, [type, sortOrder, dateRange]);
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Set type filter based on tab
    switch (value) {
      case 'reports':
        setType('upload');
        break;
      case 'standards':
        setType('standard');
        break;
      case 'users':
        // No specific type filter, but we could filter by user if needed
        setType(undefined);
        break;
      default:
        setType(undefined);
    }
  };
  
  // Handle sort toggle
  const toggleSort = () => {
    setSortOrder(current => current === 'asc' ? 'desc' : 'asc');
  };
  
  // Handle export
  const handleExport = async () => {
    try {
      const options: GetActivitiesOptions = {
        sortOrder,
        sortBy: 'createdAt'
      };
      
      // Apply type filter
      if (type) {
        options.type = type;
      }
      
      // Apply date range filter
      if (dateRange?.from) {
        options.startDate = dateRange.from;
      }
      
      if (dateRange?.to) {
        options.endDate = dateRange.to;
      }
      
      const blob = await exportActivities(options);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Activity log exported successfully');
    } catch (err) {
      toast.error('Failed to export activity log');
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setType(undefined);
    setSortOrder('desc');
    setDateRange(undefined);
    setActiveTab('all');
  };

  // Function to format date
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Function to get badge for activity type
  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'upload':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Upload</Badge>;
      case 'analysis':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Analysis</Badge>;
      case 'edit':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Edit</Badge>;
      case 'export':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Export</Badge>;
      case 'standard':
        return <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">Standard</Badge>;
      default:
        return <Badge variant="outline">Other</Badge>;
    }
  };

  return (
    <>
      <DashboardHeader 
        heading="Activity History"
        text="Track all activities related to your ESG compliance reports with Reggie."
      >
        <div className="flex items-center gap-2">
          <DatePickerWithRange 
            date={dateRange} 
            setDate={setDateRange} 
            align="end"
            className="h-9"
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1"
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Export Log
          </Button>
        </div>
      </DashboardHeader>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor="filter" className="text-sm font-medium">
                Filter Activities
              </label>
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={cn("gap-1", type && "bg-primary/10 border-primary/40")}>
                      <Filter className="h-4 w-4" />
                      {type ? type.charAt(0).toUpperCase() + type.slice(1) : 'All Activities'}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    <DropdownMenuItem
                      onClick={() => setType(undefined)}
                      className={cn(!type && "bg-accent")}
                    >
                      All Activities
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setType('upload')}
                      className={cn(type === 'upload' && "bg-accent")}
                    >
                      Upload
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setType('analysis')}
                      className={cn(type === 'analysis' && "bg-accent")}
                    >
                      Analysis
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setType('edit')}
                      className={cn(type === 'edit' && "bg-accent")}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setType('export')}
                      className={cn(type === 'export' && "bg-accent")}
                    >
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setType('standard')}
                      className={cn(type === 'standard' && "bg-accent")}
                    >
                      Standard
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1"
              onClick={toggleSort}
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort by Date {sortOrder === 'asc' ? '(Oldest)' : '(Newest)'}
            </Button>
            
            {(type || sortOrder !== 'desc' || dateRange) && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="gap-1"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                {dateRange?.from && dateRange?.to 
                  ? `Showing activities from ${format(dateRange.from, 'MMM d, yyyy')} to ${format(dateRange.to, 'MMM d, yyyy')}`
                  : 'Showing all activities'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-500">
                  {error}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found
                </div>
              ) : (
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-muted p-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getActivityBadge(activity.type)}
                            <h4 className="text-sm font-medium">
                              {activity.report ? (
                                <Link href={`/dashboard/reports/${activity.reportId}`} className="hover:underline">
                                  {activity.report.name}
                                </Link>
                              ) : (
                                activity.details
                              )}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.report ? activity.details : null}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(activity.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {activity.user || 'System'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {activity.reportId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/reports/${activity.reportId}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Report Activities</CardTitle>
              <CardDescription>
                Showing activities related to reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No report activities found
                </div>
              ) : (
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-muted p-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getActivityBadge(activity.type)}
                            <h4 className="text-sm font-medium">
                              {activity.report ? (
                                <Link href={`/dashboard/reports/${activity.reportId}`} className="hover:underline">
                                  {activity.report.name}
                                </Link>
                              ) : (
                                activity.details
                              )}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.report ? activity.details : null}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(activity.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {activity.user || 'System'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {activity.reportId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/reports/${activity.reportId}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="standards">
          <Card>
            <CardHeader>
              <CardTitle>Standard Activities</CardTitle>
              <CardDescription>
                Showing activities related to standards
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No standard activities found
                </div>
              ) : (
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-muted p-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getActivityBadge(activity.type)}
                            <h4 className="text-sm font-medium">
                              {activity.details}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(activity.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {activity.user || 'System'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Activities</CardTitle>
              <CardDescription>
                Showing activities by user
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No user activities found
                </div>
              ) : (
                <div className="space-y-6">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-start gap-3">
                        <div className="rounded-md bg-muted p-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {getActivityBadge(activity.type)}
                            <h4 className="text-sm font-medium">
                              {activity.report ? (
                                <Link href={`/dashboard/reports/${activity.reportId}`} className="hover:underline">
                                  {activity.report.name}
                                </Link>
                              ) : (
                                activity.details
                              )}
                            </h4>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {activity.report ? activity.details : null}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-muted-foreground">
                              {formatDate(activity.createdAt)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {activity.user || 'System'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {activity.reportId && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/dashboard/reports/${activity.reportId}`}>View</Link>
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}