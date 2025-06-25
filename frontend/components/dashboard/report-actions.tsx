"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2, Copy, Check, Trash2, CheckCircle2 } from "lucide-react";
import { exportReport, shareReport, deleteReport, validateReport } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface ReportActionsProps {
  reportId: string;
}

export function ReportActions({ reportId }: ReportActionsProps) {
  const router = useRouter();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleExport = async () => {
    try {
      window.open(`/api/reports/${reportId}/export`, '_blank');
    } catch (error) {
      toast.error("Failed to export report");
    }
  };

  const handleShare = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setIsSharing(true);
      const result = await shareReport(reportId, email);
      setShareLink(result.shareLink);
      toast.success("Report shared successfully");
    } catch (error) {
      toast.error("Failed to share report");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard");
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteReport(reportId);
      toast.success("Report deleted successfully");
      router.push('/dashboard/reports');
    } catch (error) {
      toast.error("Failed to delete report");
      setIsDeleting(false);
    }
  };

  const handleValidate = async () => {
    try {
      setIsValidating(true);
      toast.loading("Validating report. This may take a few minutes...");
      
      await validateReport(reportId);
      
      toast.success("Report validated successfully");
      
      // Refresh the page to show the updated report
      router.refresh();
    } catch (error) {
      console.error("Error validating report:", error);
      toast.error(error instanceof Error ? error.message : "An error occurred while validating the report.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-1"
        onClick={handleExport}
      >
        <Download className="h-4 w-4" />
        Export
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsShareDialogOpen(true)}
      >
        <Share2 className="h-4 w-4 mr-1" />
        Share
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsDeleteDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4 mr-1" />
        Delete
      </Button>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
            <DialogDescription>
              Share this report with others via email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter recipient email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            {shareLink && (
              <div className="grid gap-2">
                <Label>Share Link</Label>
                <div className="flex">
                  <Input
                    value={shareLink}
                    readOnly
                    className="flex-1 rounded-r-none"
                  />
                  <Button
                    size="icon" 
                    variant="outline" 
                    onClick={handleCopyLink}
                    className="flex-shrink-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsShareDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleShare} disabled={isSharing}>
              {isSharing ? "Sharing..." : "Share"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 