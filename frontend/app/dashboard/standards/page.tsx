"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StandardsList } from "@/components/dashboard/standards-list";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { AddStandardModal } from "@/components/dashboard/add-standard-modal";

export default function StandardsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddStandard = (standard: any) => {
    // Handle adding the standard
    // This would typically update some parent state or make an API call
    console.log('Added standard:', standard);
  };

  return (
    <>
      <DashboardHeader 
        heading="ESG Standards"
        text="Manage the ESG standards and guidelines that Reggie uses for compliance checking."
      >
        <Button 
          className="gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <PlusCircle className="h-4 w-4" />
          Add Custom Standard
        </Button>
      </DashboardHeader>
      
      <StandardsList />

      <AddStandardModal 
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddStandard={handleAddStandard}
      />
    </>
  );
}