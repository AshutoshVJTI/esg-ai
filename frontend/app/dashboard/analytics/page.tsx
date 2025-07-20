"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { XAxisWrapper as XAxis, YAxisWrapper as YAxis } from "@/components/ui/chart";
import { Download, Calendar, Loader2, AlertCircle, FileText } from "lucide-react";
import { getComplianceStats, getReports, getStandards } from "@/lib/api";
import { ComplianceStats, Report, Standard } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [complianceByStandard, setComplianceByStandard] = useState<Array<{name: string, compliance: number}>>([]);
  const [issuesByCategory, setIssuesByCategory] = useState<Array<{name: string, value: number}>>([]);
  const [complianceTrend, setComplianceTrend] = useState<Array<{month: string, compliance: number}>>([]);
  const [topIssues, setTopIssues] = useState<Array<{issue: string, count: number, category: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  // Add a new state for storing the categories from report analysis
  const [analyticsCategoryData, setAnalyticsCategoryData] = useState<Array<{name: string, value: number}>>([]);

  const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))", "hsl(var(--chart-7))", "hsl(var(--chart-8))"];
  const ESG_COLORS = ["#10b981", "#3b82f6", "#8b5cf6"]; // Green, Blue, Purple for Environmental, Social, Governance

  // Category colors mapping for consistency
  const CATEGORY_COLORS: Record<string, string> = {
    "Governance": "#8b5cf6", // Purple
    "Strategy": "#10b981", // Green
    "Risk Management": "#f59e0b", // Amber
    "Metrics and Targets": "#3b82f6", // Blue
    "Environmental": "#10b981", // Green
    "Social": "#3b82f6", // Blue
    "Disclosure": "#ec4899", // Pink
    "Compliance": "#6366f1" // Indigo
  };

  useEffect(() => {
    // Initial data fetch
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch compliance stats from API
      const fetchedStats = await getComplianceStats();
      
      // Process stats data
      let statsData = { ...fetchedStats };
      
      // If categories is missing, initialize it
      if (!statsData.categories) {
        statsData.categories = {};
      }
      
      setStats(statsData);
      
      // Process category data from stats
      const categoryData = Object.entries(statsData.categories || {})
        .map(([name, value]) => ({
          name,
          value: value as number
        }))
        .sort((a, b) => b.value - a.value);
      
      setAnalyticsCategoryData(categoryData);
    } catch (statsErr) {
      // Continue with other data fetching even if stats fail
      
      try {
        // Fetch reports and standards
        const [reportsData, standardsData] = await Promise.all([
          getReports(),
          getStandards()
        ]);
        
        // Check if we have any reports
        if (!reportsData || reportsData.length === 0) {
          setNoData(true);
          setLoading(false);
          return;
        }
        
        // Process reports for category data
        const processedCategoryData: Record<string, number> = {};
        
        for (let index = 0; index < reportsData.length; index++) {
          const report = reportsData[index];
          
          // Skip reports without results
          if (!report.results) continue;
          
          // Try to find issuesByCategory in different locations
          let issuesByCategoryData = null;
          
          if (report.results.analytics?.issuesByCategory) {
            issuesByCategoryData = report.results.analytics.issuesByCategory;
          } else if ((report.results as any).data?.analytics?.issuesByCategory) {
            issuesByCategoryData = (report.results as any).data.analytics.issuesByCategory;
          }
          
          if (issuesByCategoryData) {
            // Process category data
            issuesByCategoryData.forEach((category: { category: string; count: number }) => {
              if (!processedCategoryData[category.category]) {
                processedCategoryData[category.category] = 0;
              }
              processedCategoryData[category.category] += category.count;
            });
          }
        }
        
        // Convert processed data to array format
        const categoryDataFromReports = Object.entries(processedCategoryData)
          .map(([name, value]) => ({
            name,
            value
          }))
          .sort((a, b) => b.value - a.value);
        
        // Use this data if we don't have category data from stats
        if (categoryDataFromReports.length > 0 && analyticsCategoryData.length === 0) {
          setAnalyticsCategoryData(categoryDataFromReports);
        }
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <DashboardHeader 
          heading="ESG Analytics"
          text="Analyze your ESG compliance performance across reports and standards."
        />
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading analytics data...
          </p>
        </div>
      </>
    );
  }

  if (noData) {
    return (
      <>
        <DashboardHeader 
          heading="ESG Analytics"
          text="Analyze your ESG compliance performance across reports and standards."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <div className="text-center space-y-3 max-w-md">
              <p className="text-lg font-medium text-muted-foreground">No Reports Analyzed Yet</p>
              <p className="text-muted-foreground">
                Upload and analyze ESG reports with Reggie to see analytics and insights.
              </p>
              <Button asChild className="mt-4">
                <Link href="/dashboard/upload">
                  Upload Report
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (error) {
    return (
      <>
        <DashboardHeader 
          heading="ESG Analytics"
          text="Analyze your ESG compliance performance across reports and standards."
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive font-medium">Error loading analytics</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="mt-4"
              >
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
        heading="ESG Analytics"
        text="Analyze your ESG compliance performance with Reggie across reports and standards."
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1">
            <Calendar className="h-4 w-4" />
            Last 6 Months
          </Button>
          <Button variant="outline" size="sm" className="gap-1">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </DashboardHeader>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.averageScore || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">↑ 4%</span> from last quarter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.issues || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-red-500">↑ 3</span> from last quarter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.critical || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">↓ 5</span> from last quarter
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reports Analyzed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalReports || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-500">↑ 2</span> from last quarter
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="standards">Standards</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Compliance by Standard</CardTitle>
                <CardDescription>
                  How your reports comply with different ESG standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {complianceByStandard.length > 0 ? (
                    <div className="flex flex-col space-y-4">
                      {complianceByStandard.map((standard) => (
                        <div key={standard.name} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{standard.name}</div>
                            <div className="font-medium">{standard.compliance}%</div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="bg-primary"
                              style={{ width: `${standard.compliance}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No compliance data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Issues by Category</CardTitle>
                <CardDescription>
                  Distribution of issues across ESG categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsCategoryData.map((entry, index) => {
                          // Use consistent colors for categories
                          const color = CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length];
                          return <Cell key={`cell-${index}`} fill={color} />;
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {analyticsCategoryData.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No issues data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trend</CardTitle>
              <CardDescription>
                How your ESG compliance has changed over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {complianceTrend.length > 0 ? (
                  <div className="flex flex-col space-y-4">
                    {complianceTrend.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{item.month}</div>
                          <div className="font-medium">{item.compliance}%</div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="bg-primary"
                            style={{ width: `${item.compliance}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="esg" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {analyticsCategoryData.length > 0 ? (
              analyticsCategoryData.map((category, index) => (
                <Card key={category.name}>
                  <CardHeader>
                    <CardTitle>{category.name} Issues</CardTitle>
                    <CardDescription>
                      Issues related to {category.name.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-6">
                      <div 
                        className="text-5xl font-bold" 
                        style={{ color: COLORS[index % COLORS.length] }}
                      >
                        {category.value}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {stats && stats.issues > 0
                          ? `${Math.round((category.value / stats.issues) * 100)}% of total issues` 
                          : '0% of total issues'}
                      </p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-4">
                      <div 
                        style={{ 
                          width: `${stats && stats.issues > 0 ? (category.value / stats.issues) * 100 : 0}%`,
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="md:col-span-3">
                <CardHeader>
                  <CardTitle>No Categories Found</CardTitle>
                  <CardDescription>
                    No issue categories have been identified yet
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <p className="text-muted-foreground">
                    Upload and analyze more reports to see issue categories
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Issues Distribution</CardTitle>
              <CardDescription>
                Comparative analysis of issues across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {analyticsCategoryData.length > 0 ? (
                  <div className="flex flex-col space-y-4">
                    {analyticsCategoryData.map((category, index) => (
                      <div key={category.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{category.name}</div>
                          <div className="font-medium">{category.value}</div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            style={{ 
                              width: `${stats && stats.issues > 0 ? (category.value / stats.issues) * 100 : 0}%`,
                              backgroundColor: COLORS[index % COLORS.length]
                            }}
                            className="h-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No category data available
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                This breakdown helps identify which areas require the most attention in your compliance strategy.
                {analyticsCategoryData.length === 0 && " No issues have been identified yet."}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="standards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standards Compliance Details</CardTitle>
              <CardDescription>
                Detailed breakdown of compliance against each standard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {complianceByStandard.map((standard) => (
                  <div key={standard.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{standard.name}</h3>
                          <Badge 
                            className={
                              standard.compliance >= 80 ? "bg-green-100 text-green-800" : 
                              standard.compliance >= 70 ? "bg-amber-100 text-amber-800" : 
                              "bg-red-100 text-red-800"
                            }
                          >
                            {standard.compliance}%
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={
                          standard.compliance >= 80 ? "bg-green-500" : 
                          standard.compliance >= 70 ? "bg-amber-500" : 
                          "bg-red-500"
                        }
                        style={{ width: `${standard.compliance}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="issues" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Issues</CardTitle>
              <CardDescription>
                Most common compliance issues found in your reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topIssues.map((issue, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{issue.issue}</h3>
                          <Badge 
                            variant="outline"
                            className="text-xs"
                          >
                            {issue.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {issue.count} occurrences
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="bg-primary"
                        style={{ width: `${(issue.count / (topIssues[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Trends</CardTitle>
              <CardDescription>
                Detailed trend analysis of your ESG compliance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {complianceTrend.length > 0 ? (
                  <div className="flex flex-col space-y-4">
                    {complianceTrend.map((item, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{item.month}</div>
                          <div className="font-medium">{item.compliance}%</div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="bg-primary"
                            style={{ width: `${item.compliance}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No trend data available
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Note: Trend data is based on available historical compliance scores from your reports. Months with no reports use interpolated values.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}