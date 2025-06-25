"use client";

import { useState, useEffect } from 'react';
import { CheckSquare, PlusCircle, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { getStandards } from '@/lib/api';
import { Standard } from '@/lib/types';
import { toast } from 'sonner';

interface StandardsSelectorProps {
  selectedStandards: string[];
  onSelectStandards: (standards: string[]) => void;
  disabled?: boolean;
}

export function StandardsSelector({ 
  selectedStandards = [],
  onSelectStandards, 
  disabled 
}: StandardsSelectorProps) {
  const [standards, setStandards] = useState<Standard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStandards = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStandards();
      setStandards(data.filter(s => s.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load standards');
      toast.error('Failed to load standards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStandards();
  }, []);

  const handleStandardToggle = (standardId: string) => {
    const currentSelected = selectedStandards || [];
    const newSelected = currentSelected.includes(standardId)
      ? currentSelected.filter(id => id !== standardId)
      : [...currentSelected, standardId];
    
    onSelectStandards(newSelected);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ESG Standards</CardTitle>
          <CardDescription>
            Loading available standards...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Fetching available standards...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ESG Standards</CardTitle>
          <CardDescription>
            Unable to load standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-center space-y-2">
              <p className="text-sm text-destructive font-medium">Error loading standards</p>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button 
                variant="outline" 
                onClick={fetchStandards}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ESG Standards</CardTitle>
        <CardDescription>
          Select standards to check compliance against
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {standards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <div className="text-center space-y-2">
              <p className="font-medium text-muted-foreground">No standards available</p>
              <p className="text-sm text-muted-foreground">
                Start by adding some ESG standards to check compliance against
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <Button asChild variant="default">
                  <Link href="/dashboard/standards/new">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add New Standard
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/standards">Manage Standards</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Available Standards</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    {standards.length} standard{standards.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 gap-1"
                  asChild
                >
                  <Link href="/dashboard/standards/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="text-xs">Add New</span>
                  </Link>
                </Button>
              </div>
              
              {selectedStandards.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 text-sm">
                  <p className="font-medium">
                    {selectedStandards.length} standard{selectedStandards.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Your report will be checked against these standards
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {standards.map((standard) => (
                  <div 
                    key={standard.id} 
                    className={`flex items-start space-x-3 p-3 rounded-lg transition-colors ${
                      selectedStandards.includes(standard.id) ? 'bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      id={standard.id}
                      checked={selectedStandards.includes(standard.id)}
                      onCheckedChange={() => handleStandardToggle(standard.id)}
                      disabled={disabled}
                    />
                    <div className="space-y-1">
                      <Label
                        htmlFor={standard.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {standard.name}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {standard.description}
                      </p>
                      {standard.categories && standard.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {standard.categories.map((category) => (
                            <Badge key={category} variant="outline" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/standards">Manage All Standards</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}