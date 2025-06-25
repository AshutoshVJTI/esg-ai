"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DocumentViewer } from "./document-viewer";
import { ExternalLink, Download, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    name: string;
    url: string;
    type: string;
    size?: number;
  } | null;
}

export function FilePreviewDialog({ open, onOpenChange, file }: FilePreviewDialogProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Reset states when dialog opens or file changes
    if (open && file) {
      setError(null);
      setIsLoading(true);
    }
  }, [open, file]);

  if (!file) return null;

  const handleDownload = () => {
    try {
      setIsDownloading(true);
      
      // Ensure the URL is properly formatted
      const formattedUrl = file.url.startsWith('http')
        ? file.url
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${file.url.startsWith('/') ? '' : '/'}${file.url}`;
      
      // Open the file in a new tab for download
      // This avoids CORS issues with the fetch API
      window.open(formattedUrl, '_blank');
      
      toast.success('File opened in a new tab for download');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  // Format file size for display
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  // Determine if the file is a PDF or other document type that can be previewed
  const isPDF = file.type === 'application/pdf' || file.url.toLowerCase().endsWith('.pdf');
  
  // Ensure the URL is properly formatted - always use the backend URL
  let formattedUrl = file.url;
  
  // For external URLs, use the preview endpoint
  if (file.url.startsWith('http') && !file.url.includes(process.env.NEXT_PUBLIC_API_URL || 'localhost:3001')) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    formattedUrl = `${apiBaseUrl}/preview?url=${encodeURIComponent(file.url)}`;
  } else if (!file.url.startsWith('http')) {
    // For local files
    formattedUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${file.url.startsWith('/') ? '' : '/'}${file.url}`;
  }

  // Add a cache-busting parameter to avoid browser caching issues
  const urlWithCacheBuster = `${formattedUrl}${formattedUrl.includes('?') ? '&' : '?'}cache=${Date.now()}`;

  const handleViewerError = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  const handleViewerLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {file.name}
          </DialogTitle>
          <DialogDescription>
            {formatFileSize(file.size)} • {file.type || 'Document'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isPDF ? (
            <DocumentViewer 
              fileUrl={urlWithCacheBuster} 
              onError={handleViewerError}
              onLoad={handleViewerLoad}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-muted/20 rounded-lg">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="font-medium">Preview not available</p>
                <p className="text-sm text-muted-foreground">
                  This file type cannot be previewed directly. Please download the file to view its contents.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button
            variant="outline"
            onClick={() => window.open(urlWithCacheBuster, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in New Tab
          </Button>
          
          <Button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {isDownloading ? 'Opening...' : 'Download'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 