"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, AlertCircle, FileText, Upload } from "lucide-react";
import Link from "next/link";
import { getComplianceStats } from "@/lib/api";
import { ComplianceStats } from "@/lib/types";
import { toast } from "sonner";

export function ComplianceOverview() {
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noData, setNoData] = useState(false);

  // Extract fetchStats to a named function that can be reused
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      setNoData(false);
      
      const data = await getComplianceStats();
      
      // Check if we have meaningful data
      const hasData = data.totalReports > 0;
      if (!hasData) {
        setNoData(true);
      } else {
        setStats(data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load compliance statistics';
      
      // Check if the error is due to no data available
      if (
        errorMessage.includes('No reports found') || 
        errorMessage.includes('No compliance data') ||
        errorMessage.includes('No data available')
      ) {
        setNoData(true);
      } else {
        setError(errorMessage);
        toast.error('Failed to load compliance statistics');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>
            Loading compliance statistics...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Fetching latest statistics...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (noData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>
            No compliance data available yet
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-3 max-w-md">
            <p className="text-lg font-medium text-muted-foreground">No Reports Analyzed Yet</p>
            <p className="text-muted-foreground">
              Upload and analyze ESG reports with Reggie to see compliance statistics and insights.
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/upload">
                <Upload className="h-4 w-4 mr-2" />
                Upload Report
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>
            Unable to load compliance statistics
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <div className="text-center space-y-2">
            <p className="text-sm text-destructive font-medium">Error loading statistics</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              onClick={fetchStats}
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>
            No compliance data available
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          Upload and analyze reports to see compliance statistics
        </CardContent>
      </Card>
    );
  }

  // Check if all values are zero, which might indicate no meaningful data
  const hasData = stats.totalReports > 0 || stats.compliant > 0 || stats.issues > 0 || stats.critical > 0;
  
  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Overview</CardTitle>
          <CardDescription>
            No compliance issues detected yet
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
          <FileText className="h-16 w-16 text-muted-foreground" />
          <div className="text-center space-y-3 max-w-md">
            <p className="text-lg font-medium text-muted-foreground">No Compliance Data Yet</p>
            <p className="text-muted-foreground">
              Your reports are being processed or no compliance issues have been detected.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/dashboard/reports">
                View Reports
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: "Compliant", value: stats.compliant },
    { name: "Issues", value: stats.issues },
    { name: "Critical", value: stats.critical },
  ];
  
  const COLORS = ["hsl(var(--chart-2))", "hsl(var(--chart-4))", "hsl(var(--chart-1))"];

  // Category colors mapping
  const CATEGORY_COLORS: Record<string, string> = {
    "Governance": "hsl(var(--chart-6))",
    "Strategy": "hsl(var(--chart-3))",
    "Risk Management": "hsl(var(--chart-4))",
    "Metrics and Targets": "hsl(var(--chart-5))",
    "Environmental": "hsl(var(--chart-3))",
    "Social": "hsl(var(--chart-5))",
    "Disclosure": "hsl(var(--chart-7))",
    "Compliance": "hsl(var(--chart-8))"
  };

  // Create category data from the categories object
  const categoryData = stats.categories ? 
    Object.entries(stats.categories)
      .map(([name, value]) => ({
        name,
        value,
        color: CATEGORY_COLORS[name] || `hsl(var(--chart-${Math.floor(Math.random() * 8) + 1}))`
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value) : 
    [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Overview</CardTitle>
        <CardDescription>
          Summary of your ESG compliance status across {stats.totalReports} reports
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                formatter={(value, entry, index) => (
                  <span className="text-xs">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-2xl font-bold text-primary">
            {stats.averageScore}%
          </p>
          <p className="text-sm text-muted-foreground">
            Average Compliance Score
          </p>
        </div>
        
        {categoryData.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <h3 className="text-sm font-medium">Issues by Category</h3>
            <div className="space-y-3">
              {categoryData.map((item) => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{item.value} issues</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-muted">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (item.value / Math.max(...categoryData.map(d => d.value))) * 100)}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Button asChild variant="outline" className="w-full gap-1">
          <Link href="/dashboard/analytics">
            View Detailed Analytics
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}