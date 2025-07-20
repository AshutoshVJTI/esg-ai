import { DashboardHeader } from "@/components/dashboard/header";
import { UploadForm } from "@/components/dashboard/upload-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function UploadPage() {
  return (
    <>
      <DashboardHeader 
        heading="Upload ESG Report"
        text="Upload your ESG report for Reggie's AI-powered compliance analysis."
      />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Document</CardTitle>
            <CardDescription>
              Upload your ESG report in PDF or DOCX format for Reggie to analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}