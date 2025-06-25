"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, FileText, Loader2, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  fileUrl: string;
  highlights?: Array<{
    text: string;
    severity: 'critical' | 'warning' | 'info';
    description?: string;
    recommendation?: string;
    page?: number;
  }>;
  onError?: (errorMessage: string) => void;
  onLoad?: () => void;
}

export function DocumentViewer({ fileUrl, highlights = [], onError, onLoad }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentHighlightIndex, setCurrentHighlightIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function checkDocument() {
      try {
        setLoading(true);
        setError(null);
        
        // Make sure we have a valid URL
        if (!fileUrl) {
          const errorMessage = "No document URL provided";
          setError(errorMessage);
          if (onError) onError(errorMessage);
          return;
        }

        // Check if URL is relative (from our backend) or absolute (external)
        const isRelativeUrl = !fileUrl.startsWith('http');
        
        // For relative URLs, make sure they start with /uploads/
        const url = isRelativeUrl && !fileUrl.startsWith('/uploads/') 
          ? `/uploads/${fileUrl}` 
          : fileUrl;
        
        // Simple HEAD request without custom headers that might trigger CORS preflight
        const response = await fetch(url, {
          method: 'HEAD',
          cache: 'no-cache' // Prevent caching issues
        });

        if (!response.ok) {
          console.error('Document check failed:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          });
          const errorMessage = `Failed to load document (${response.status}: ${response.statusText})`;
          setError(errorMessage);
          if (onError) onError(errorMessage);
          toast.error(errorMessage);
        } else {
          if (onLoad) onLoad();
        }
      } catch (error) {
        console.error('Error checking document:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load document';
        setError(errorMessage);
        if (onError) onError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (fileUrl) {
      checkDocument();
    } else {
      setError("No document URL provided");
      setLoading(false);
    }
  }, [fileUrl, onError, onLoad, retryCount]);

  const currentHighlight = highlights[currentHighlightIndex];

  const navigateHighlight = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentHighlightIndex(prev =>
        prev > 0 ? prev - 1 : highlights.length - 1
      );
    } else {
      setCurrentHighlightIndex(prev =>
        prev < highlights.length - 1 ? prev + 1 : 0
      );
    }
  };

  // Handle iframe load event
  const handleIframeLoad = () => {
    setLoading(false);
    if (onLoad) onLoad();
  };

  // Handle iframe error event
  const handleIframeError = () => {
    const errorMessage = "Failed to load document in the viewer";
    setError(errorMessage);
    if (onError) onError(errorMessage);
  };

  // Prepare the URL for the iframe
  const getIframeUrl = () => {
    // If it's already an absolute URL, use it directly
    if (fileUrl.startsWith('http')) {
      return fileUrl;
    }
    
    // For relative URLs, make sure they start with /uploads/
    return fileUrl.startsWith('/uploads/') ? fileUrl : `/uploads/${fileUrl}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] space-y-6 bg-muted/20 rounded-lg">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">Loading Document</p>
          <p className="text-sm text-muted-foreground">
            Please wait while we prepare your document for viewing...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] space-y-6 bg-muted/20 rounded-lg p-6">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <div className="text-center space-y-3">
          <p className="text-lg font-medium text-destructive">Document Error</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
            <Button
              variant="outline"
              onClick={() => window.open(getIframeUrl(), '_blank')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button 
              variant="default" 
              onClick={() => {
                setRetryCount(prev => prev + 1);
              }}
            >
              <Loader2 className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="relative h-[600px]">
        <div className="w-full h-full">
          <Button
            variant="outline"
            size="sm"
            className="absolute top-2 right-2 z-10"
            onClick={() => window.open(getIframeUrl(), '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          <iframe
            ref={iframeRef}
            src={getIframeUrl()}
            className="w-full h-full rounded-lg"
            title="Document Viewer"
            allow="fullscreen"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
          />
        </div>
      </Card>
    </div>
  );
} 