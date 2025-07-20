"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StandardsSelector } from "@/components/dashboard/standards-selector";
import { uploadFile, createReport, checkReportStatus, type CreateReportRequest } from "@/lib/api";
import { toast } from "sonner";

export function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [statusCheckInterval, setStatusCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [statusCheckInterval]);

  // Function to start polling for report status
  const startStatusPolling = (id: string) => {
    // Clear any existing interval
    if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
    }

    // Set up polling every 5 seconds
    const interval = setInterval(async () => {
      try {
        const statusResult = await checkReportStatus(id);
        
        if (statusResult.isCompleted) {
          // Report is completed, show notification
          toast.dismiss('validating-report');
          toast.success('Report analysis completed!', {
            id: 'report-completed',
            description: 'Your report has been analyzed and is ready to view.',
            action: {
              label: 'View Report',
              onClick: () => {
                router.push(`/dashboard/reports/${id}`);
              }
            },
            duration: 0, // Don't auto-dismiss
          });
          
          // Clear the interval
          clearInterval(interval);
          setStatusCheckInterval(null);
          setValidating(false);
          setSuccess(true);
        } else if (statusResult.status === 'FAILED') {
          // Report processing failed
          toast.dismiss('validating-report');
          toast.error('Report analysis failed', {
            id: 'report-failed',
            description: 'There was an error analyzing your report.',
            duration: 0, // Don't auto-dismiss
          });
          
          // Clear the interval
          clearInterval(interval);
          setStatusCheckInterval(null);
          setValidating(false);
          setError('Report analysis failed');
        }
      } catch (err) {
        // Error handling is preserved but without logging
      }
    }, 5000); // Check every 5 seconds
    
    setStatusCheckInterval(interval);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile && !reportName) {
      setReportName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
    setError(null);
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    if (!reportName.trim()) {
      setError("Please provide a name for your report");
      return;
    }

    if (selectedStandards.length === 0) {
      setError("Please select at least one standard");
      return;
    }

    // Check file type
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF and DOCX files are supported");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Upload the file
      const uploadResult = await uploadFile(file, (progress) => {
        setProgress(progress);
      });

      setUploading(false);
      setValidating(true);
      toast.success('File uploaded successfully');
      toast.loading('Validating report with AI. This may take a few minutes...', {
        id: 'validating-report'
      });

      // Create the report
      const reportData: CreateReportRequest = {
        name: reportName,
        description: reportDescription,
        standards: selectedStandards,
        fileUrl: uploadResult.fileUrl,
        status: 'PENDING'
      };

      const report = await createReport(reportData);
      setReportId(report.id);
      
      // Store report ID in localStorage to allow status checking even after page navigation
      localStorage.setItem('pendingReportId', report.id);
      localStorage.setItem('pendingReportName', reportName);
      
      // Start polling for report status
      startStatusPolling(report.id);
      
      // Redirect to reports list
      router.push('/dashboard/reports');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
      toast.error('Failed to process file');
      setUploading(false);
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 relative transition-colors ${uploading || validating ? 'bg-muted/30 border-muted' : 'hover:bg-muted/10 hover:border-primary/50'}`}>
        <input
          type="file"
          accept=".pdf,.docx"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileChange}
          disabled={uploading || validating}
        />
        <div className="text-center">
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Upload Report</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Drop your ESG report here for Reggie to analyze, or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PDF and DOCX files
          </p>
        </div>
      </div>

      {file && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            {!uploading && !validating && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Report Name</Label>
              <Input
                id="name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Enter report name"
                disabled={uploading || validating}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Brief description of the report"
                disabled={uploading || validating}
              />
            </div>

            <div className="space-y-2">
              <Label>Select Standards</Label>
              <StandardsSelector
                selectedStandards={selectedStandards}
                onSelectStandards={setSelectedStandards}
                disabled={uploading || validating}
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="animate-in fade-in-50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 text-green-800 border-green-200 animate-in fade-in-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Report processed successfully. Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {uploading && (
            <div className="space-y-4 animate-in fade-in-50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <AlertTitle>Processing</AlertTitle>
                <AlertDescription>
                  Your report is being uploaded. This may take a few moments depending on the file size.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {validating && (
            <div className="space-y-4 animate-in fade-in-50">
              <Alert className="bg-purple-50 text-purple-800 border-purple-200">
                <Brain className="h-4 w-4 animate-pulse text-purple-600" />
                <AlertTitle>AI Validation</AlertTitle>
                <AlertDescription>
                  Your report is being analyzed by our AI. This process may take a few minutes as we extract insights, identify compliance issues, and generate recommendations.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleUpload}
            disabled={!file || uploading || validating}
          >
            {uploading ? (
              <span className="flex items-center">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </span>
            ) : validating ? (
              <span className="flex items-center">
                <Brain className="h-4 w-4 mr-2 animate-pulse" />
                Validating...
              </span>
            ) : 'Upload & Validate Report'}
          </Button>
        </div>
      )}
    </div>
  );
}