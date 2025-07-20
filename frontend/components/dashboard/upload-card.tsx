"use client";

import { Upload } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function UploadCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Report</CardTitle>
        <CardDescription>
          Upload your ESG report for Reggie to analyze
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4 py-6">
        <div className="rounded-full bg-primary/10 p-6">
          <Upload className="h-8 w-8 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Drag and drop your file or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            Supports PDF, DOCX (max 10MB)
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/upload">Upload Report</Link>
        </Button>
      </CardContent>
    </Card>
  );
}