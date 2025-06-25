"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, FileText, Info, MessageSquare, Loader2, BarChart3, TrendingUp, AlertTriangle } from "lucide-react";
import { getReport } from "@/lib/api";
import { toast } from "sonner";
import { DocumentViewer } from "@/components/dashboard/document-viewer";
import { Report, ReportIssue, Analytics } from "@/lib/types";
import { Progress } from "@/components/ui/progress";
import { IssuesRecommendations } from "@/components/dashboard/issues-recommendations";

interface ReportViewerProps {
  reportId: string;
}

export function ReportViewer({ reportId }: ReportViewerProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Helper function to safely get analytics data
  const getAnalyticsData = () => {
    if (!report || !report.results) return null;
    // Check all possible locations for analytics data
    return report.results.analytics || 
           (report.results as any).data?.analytics || 
           (report as any).data?.analytics || 
           null;
  };
  
  // Helper function to check if an analytics array exists and has items
  const hasAnalyticsArray = (arrayName: keyof Analytics) => {
    const analytics = getAnalyticsData();
    return analytics && analytics[arrayName] && (analytics[arrayName] as any)?.length > 0;
  };
  
  // Helper function to get an analytics array safely
  const getAnalyticsArray = <T extends any>(arrayName: keyof Analytics): T[] => {
    const analytics = getAnalyticsData();
    return (analytics && analytics[arrayName] ? analytics[arrayName] as T[] : []) as T[];
  };
  
  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await getReport(reportId);
      
      // Check if analytics data exists
      if (data.results) {
        if (data.results.analytics) {
          // Analytics data found at the expected location
        } else if ((data.results as any).data?.analytics) {
          // Ensure analytics is accessible at the top level
          data.results.analytics = (data.results as any).data.analytics;
        } else if ((data as any).data?.analytics) {
          // Handle the case where analytics is nested under data.analytics
          if (!(data.results as any).data) (data.results as any).data = {};
          (data.results as any).data.analytics = (data as any).data.analytics;
          data.results.analytics = (data as any).data.analytics;
        }
      }
      
      setReport(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch report';
      setError(errorMessage);
      toast.error(`Failed to fetch report: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center h-[600px] space-y-6">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium">Loading Report</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we retrieve your report data...
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Issues & Recommendations</h3>
              <div className="flex flex-col items-center justify-center h-48 space-y-4">
                <div className="animate-pulse space-y-3 w-full">
                  <div className="h-10 bg-muted rounded-md w-full"></div>
                  <div className="h-10 bg-muted rounded-md w-full"></div>
                  <div className="h-10 bg-muted rounded-md w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-3 max-w-md mx-auto">
              <p className="text-lg font-medium text-destructive">Error Loading Report</p>
              <p className="text-muted-foreground">{error || 'Report not found'}</p>
              <div className="pt-4">
                <Button 
                  onClick={fetchReport}
                  className="mx-auto"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="document">
              <div className="border-b px-3">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="document">Document</TabsTrigger>
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                  <TabsTrigger value="standards">Standards</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="document" className="p-4 min-h-[600px]">
                {report?.fileUrl ? (
                  <DocumentViewer
                    fileUrl={report.fileUrl}
                    highlights={report.results?.findings?.flatMap(finding => 
                      finding.issues.map(issue => ({
                        text: issue.highlightedText || issue.description,
                        severity: issue.severity as 'critical' | 'warning' | 'info',
                        description: issue.description,
                        recommendation: issue.recommendation,
                        page: issue.page || (issue.textLocation?.pageNumber)
                      }))
                    ).filter((highlight): highlight is NonNullable<typeof highlight> => 
                      Boolean(highlight?.text)
                    ) ?? []}
                  />
                ) : (
                  <div className="bg-muted/30 rounded-lg p-4 h-full flex flex-col items-center justify-center">
                    <div className="max-w-md mx-auto text-center space-y-4">
                      <FileText className="h-16 w-16 text-muted-foreground mx-auto" />
                      <h3 className="text-lg font-medium">Document Preview</h3>
                      <p className="text-sm text-muted-foreground">
                        Document preview not available
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="summary" className="p-4 space-y-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{report.results?.reportName || report.name}</h3>
                    <p className="text-sm text-muted-foreground">{report.results?.summary || report.description}</p>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                        <Badge>{report.status}</Badge>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Upload Date</div>
                        <div>{new Date(report.uploadedAt).toLocaleDateString()}</div>
                      </CardContent>
                    </Card>
                    
                    {report.results?.processedAt && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Processed Date</div>
                          <div>{new Date(report.results.processedAt).toLocaleDateString()}</div>
                        </CardContent>
                      </Card>
                    )}
                    
                    {(report.results?.overallScore || report.results?.score) && (
                      <Card>
                        <CardContent className="p-4">
                          <div className="text-sm font-medium text-muted-foreground mb-1">Overall Score</div>
                          <div className="text-2xl font-bold">{report.results.overallScore || report.results.score}%</div>
                          <Progress 
                            value={report.results.overallScore || report.results.score} 
                            className="h-2 mt-2" 
                          />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                  
                  {hasAnalyticsArray('topIssueAreas') && (
                    <div className="mt-6">
                      <h4 className="text-md font-medium mb-3">Top Issue Areas</h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        {getAnalyticsArray<{area: string; category: string; count: number}>('topIssueAreas').slice(0, 2).map((issue, index) => (
                          <Card key={index}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium">{issue.area}</div>
                                  <div className="text-sm text-muted-foreground">{issue.category}</div>
                                </div>
                                <Badge variant="outline">{issue.count} issues</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="standards" className="p-4 space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Standards Compliance</h3>
                  
                  <div className="space-y-4">
                    {report.standards?.map((standard) => {
                      const findingForStandard = report.results?.findings?.find(
                        f => f.standard === standard.id
                      );
                      
                      return (
                        <div key={standard.id} className="border rounded-lg overflow-hidden">
                          <div className="bg-muted/50 px-4 py-2 font-medium">{standard.name}</div>
                          <div className="p-4">
                            {findingForStandard ? (
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span>Compliance Score</span>
                                  <Badge 
                                    className={
                                      findingForStandard.compliance >= 80
                                        ? 'bg-green-100 text-green-800'
                                        : findingForStandard.compliance >= 60
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-red-100 text-red-800'
                                    }
                                  >
                                    {findingForStandard.compliance}% Compliant
                                  </Badge>
                                </div>
                                <Progress 
                                  value={findingForStandard.compliance} 
                                  className="h-2" 
                                />
                                {findingForStandard.issues.length > 0 && (
                                  <div className="mt-4 pt-4 border-t">
                                    <h4 className="text-sm font-medium mb-2">Issues Found ({findingForStandard.issues.length})</h4>
                                    <ul className="space-y-2 text-sm">
                                      {findingForStandard.issues.map((issue, idx) => (
                                        <li key={idx} className="flex items-start">
                                          <div className="mr-2 mt-0.5">
                                            {issue.severity === 'critical' && (
                                              <AlertCircle className="h-4 w-4 text-red-500" />
                                            )}
                                            {issue.severity === 'warning' && (
                                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                                            )}
                                            {issue.severity === 'info' && (
                                              <Info className="h-4 w-4 text-blue-500" />
                                            )}
                                          </div>
                                          <span>{issue.description}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No compliance data available</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="analytics" className="p-4 space-y-6">
                {getAnalyticsData() ? (
                  <div className="space-y-8">
                    {/* Overall Summary */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Overall Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="text-sm font-medium text-muted-foreground mb-1">Overall Score</div>
                            <div className="text-2xl font-bold">{report.results?.overallScore || report.results?.score || report.results?.data?.overallScore}%</div>
                            <Progress 
                              value={report.results?.overallScore || report.results?.score || report.results?.data?.overallScore} 
                              className="h-2 mt-2" 
                            />
                          </CardContent>
                        </Card>
                        
                        {(report.results?.summary || report.results?.data?.summary) && (
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-sm font-medium text-muted-foreground mb-1">Summary</div>
                              <p className="text-sm">{report.results?.summary || report.results?.data?.summary}</p>
                            </CardContent>
                          </Card>
                        )}
                        
                        {(report.results?.processedAt || report.results?.data?.processedAt) && (
                          <Card>
                            <CardContent className="p-4">
                              <div className="text-sm font-medium text-muted-foreground mb-1">Processed At</div>
                              <div>{new Date(report.results?.processedAt || report.results?.data?.processedAt || '').toLocaleString()}</div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                    
                    {/* Compliance Trend */}
                    {hasAnalyticsArray('complianceTrend') && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Compliance Trend</h3>
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex flex-col space-y-2">
                              {getAnalyticsArray<{period: string; score: number}>('complianceTrend').map((trend, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="font-medium">{trend.period}</span>
                                  <div className="flex items-center space-x-2">
                                    <span>{trend.score}%</span>
                                    <Progress value={trend.score} className="w-32 h-2" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Issues by Category */}
                    {hasAnalyticsArray('issuesByCategory') && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Issues by Category</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {getAnalyticsArray<{category: string; count: number; percentage: number}>('issuesByCategory').map((category, index) => (
                                  <div key={index} className="space-y-2">
                                    <div className="flex justify-between">
                                      <span className="font-medium">{category.category}</span>
                                      <span>{category.count} ({category.percentage}%)</span>
                                    </div>
                                    <Progress value={category.percentage} className="h-2" />
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Issues by Severity */}
                          {hasAnalyticsArray('issuesBySeverity') && (
                            <Card>
                              <CardContent className="p-4">
                                <h4 className="text-sm font-medium mb-4">Issues by Severity</h4>
                                <div className="space-y-4">
                                  {getAnalyticsArray<{severity: string; count: number; percentage: number}>('issuesBySeverity').map((severity, index) => (
                                    <div key={index} className="space-y-2">
                                      <div className="flex justify-between">
                                        <div className="flex items-center">
                                          {severity.severity === 'critical' && (
                                            <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                                          )}
                                          {severity.severity === 'warning' && (
                                            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                                          )}
                                          {severity.severity === 'info' && (
                                            <Info className="h-4 w-4 text-blue-500 mr-2" />
                                          )}
                                          <span className="capitalize">{severity.severity}</span>
                                        </div>
                                        <span>{severity.count} ({severity.percentage}%)</span>
                                      </div>
                                      <Progress 
                                        value={severity.percentage} 
                                        className={`h-2 ${
                                          severity.severity === 'critical' 
                                            ? 'bg-red-100' 
                                            : severity.severity === 'warning' 
                                            ? 'bg-amber-100' 
                                            : 'bg-blue-100'
                                        }`} 
                                      />
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Top Issue Areas */}
                    {hasAnalyticsArray('topIssueAreas') && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Top Issue Areas</h3>
                        <Card>
                          <CardContent className="p-4">
                            <div className="space-y-4">
                              {getAnalyticsArray<{area: string; category: string; count: number}>('topIssueAreas').map((issue, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">{issue.area}</div>
                                    <div className="text-sm text-muted-foreground">{issue.category}</div>
                                  </div>
                                  <Badge variant="outline">{issue.count} issues</Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                    
                    {/* Improvement Opportunities */}
                    {hasAnalyticsArray('improvementOpportunities') && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Improvement Opportunities</h3>
                        <div className="space-y-4">
                          {getAnalyticsArray<{area: string; description: string; potential: string}>('improvementOpportunities').map((opportunity, index) => (
                            <Card key={index}>
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium">{opportunity.area}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{opportunity.description}</p>
                                  </div>
                                  <Badge 
                                    className={
                                      opportunity.potential === 'high'
                                        ? 'bg-green-100 text-green-800'
                                        : opportunity.potential === 'medium'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }
                                  >
                                    {opportunity.potential} potential
                                  </Badge>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-lg font-medium">No Analytics Available</p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Analytics data is not available for this report. This could be because the report was processed with an older version of the system.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-6">
        <IssuesRecommendations 
          issues={report.results?.findings?.flatMap(finding => 
            finding.issues?.map((issue, index) => ({
              id: issue.id || `${finding.standard}-${index}`,
              severity: issue.severity,
              type: issue.type,
              description: issue.description,
              recommendation: issue.recommendation,
              highlightedText: issue.highlightedText,
              page: issue.page || issue.textLocation?.pageNumber
            }))
          ).filter(Boolean) || []}
        />
        
        {report.results?.analytics?.improvementOpportunities && report.results.analytics.improvementOpportunities.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-medium mb-4">Improvement Opportunities</h3>
              <div className="space-y-4">
                {report.results.analytics.improvementOpportunities.map((opportunity, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{opportunity.area}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{opportunity.description}</p>
                      </div>
                      <Badge 
                        className={
                          opportunity.potential === 'high'
                            ? 'bg-green-100 text-green-800'
                            : opportunity.potential === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }
                      >
                        {opportunity.potential} potential
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}