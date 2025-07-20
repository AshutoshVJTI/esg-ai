"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info, Edit, Trash2, ExternalLink, PlusCircle, X, Upload, FileText, File, AlertCircle, Loader2, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddStandardModal } from "./add-standard-modal";
import { FilePreviewDialog } from "./file-preview-dialog";
import { getStandards, updateStandard, deleteStandard } from "@/lib/api";
import { toast } from "sonner";

interface StandardsState {
  [key: string]: boolean;
}

interface CustomStandard {
  id: string;
  name: string;
  description: string;
  categories: string[];
  files?: File[];
}

interface FileWithPreview extends File {
  preview?: string;
}

export function StandardsList() {
  const [standards, setStandards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeStandards, setActiveStandards] = useState<StandardsState>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    fetchStandards();
  }, []);

  const fetchStandards = async () => {
    try {
      setLoading(true);
      const data = await getStandards();
      setStandards(data);
      
      // Initialize active states
      const activeStates: StandardsState = {};
      data.forEach((standard: any) => {
        activeStates[standard.id] = standard.isActive;
      });
      setActiveStandards(activeStates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch standards');
      toast.error('Failed to fetch standards');
    } finally {
      setLoading(false);
    }
  };

  const toggleStandard = async (id: string) => {
    try {
      const standard = standards.find(s => s.id === id);
      if (!standard) return;

      const newState = !activeStandards[id];
      await updateStandard(id, { isActive: newState });
      
      setActiveStandards(prev => ({
        ...prev,
        [id]: newState
      }));

      toast.success(`${standard.name} ${newState ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Failed to update standard');
    }
  };

  const handleDeleteStandard = async (id: string) => {
    try {
      await deleteStandard(id);
      setStandards(prev => prev.filter(s => s.id !== id));
      toast.success('Standard deleted successfully');
    } catch (err) {
      toast.error('Failed to delete standard');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Loading Standards</p>
              <p className="text-sm text-muted-foreground">
                Please wait while we retrieve your compliance standards...
              </p>
            </div>
            <div className="w-full max-w-md mt-8">
              <div className="animate-pulse space-y-4">
                <div className="h-12 bg-muted rounded-md w-full"></div>
                <div className="h-24 bg-muted rounded-md w-full"></div>
                <div className="h-24 bg-muted rounded-md w-full"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-6">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div className="space-y-3 max-w-md mx-auto">
              <p className="text-lg font-medium text-destructive">Error Loading Standards</p>
              <p className="text-muted-foreground">{error}</p>
              <Button 
                onClick={fetchStandards}
                className="mt-4"
              >
                <Loader2 className="h-4 w-4 mr-2" />
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
      <CardContent className="p-0">
        <Tabs defaultValue="popular">
          <TabsList className="w-full border-b rounded-none">
            <TabsTrigger value="popular">Popular Standards</TabsTrigger>
            <TabsTrigger value="custom">Custom Standards</TabsTrigger>
          </TabsList>
          
          <TabsContent value="popular" className="p-8 space-y-6">
            {standards.filter(standard => !standard.isCustom).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <FileText className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-3 max-w-md mx-auto">
                  <p className="text-lg font-medium text-muted-foreground">No Standards Available</p>
                  <p className="text-muted-foreground">
                    There are no popular standards available in the system yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Contact your administrator to add ESG standards for Reggie to use, or create your own custom standards.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Custom Standard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {standards
                  .filter(standard => !standard.isCustom)
                  .map(standard => (
                    <StandardItem 
                      key={standard.id}
                      {...standard}
                      active={activeStandards[standard.id]}
                      onToggle={() => toggleStandard(standard.id)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="custom" className="p-8 space-y-6">
            {standards.filter(standard => standard.isCustom).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6">
                <PlusCircle className="h-16 w-16 text-muted-foreground" />
                <div className="text-center space-y-3 max-w-md mx-auto">
                  <p className="text-lg font-medium text-muted-foreground">No Custom Standards Yet</p>
                  <p className="text-muted-foreground">
                    You haven't created any custom standards yet.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add your own standards to track compliance against custom guidelines and requirements specific to your organization.
                  </p>
                  <Button 
                    variant="default" 
                    className="mt-4"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Custom Standard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {standards
                  .filter(standard => standard.isCustom)
                  .map(standard => (
                    <StandardItem 
                      key={standard.id}
                      {...standard}
                      active={activeStandards[standard.id]}
                      onToggle={() => toggleStandard(standard.id)}
                      custom
                      onDelete={() => handleDeleteStandard(standard.id)}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <AddStandardModal 
        open={isAddModalOpen} 
        onOpenChange={setIsAddModalOpen}
        onAddStandard={(newStandard) => {
          setStandards(prev => [...prev, newStandard]);
          setActiveStandards(prev => ({
            ...prev,
            [newStandard.id]: true
          }));
        }}
      />
    </Card>
  );
}

interface StandardItemProps {
  id: string;
  name: string;
  description: string;
  website?: string;
  active: boolean;
  onToggle: () => void;
  categories: string[];
  custom?: boolean;
  files?: any[];
  onDelete?: () => void;
}

function StandardItem({ 
  id, 
  name, 
  description, 
  website, 
  active, 
  onToggle, 
  categories,
  custom = false,
  files = [],
  onDelete
}: StandardItemProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreviewFile = (file: any) => {
    // Ensure the file has the correct URL format
    const fileWithCorrectUrl = {
      ...file,
      // If the URL doesn't start with http, ensure it's a relative path that will be properly formatted in the FilePreviewDialog
      url: file.url.startsWith('http') ? file.url : file.url.startsWith('/') ? file.url : `/${file.url}`
    };
    
    setSelectedFile(fileWithCorrectUrl);
    setIsPreviewOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start gap-4">
        <div className="space-y-4 flex-1">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">{name}</h3>
              {website && (
                <a 
                  href={website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <Badge key={index} variant="secondary">{category}</Badge>
            ))}
          </div>
          
          {files && files.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-sm font-medium mb-2">Associated Documents:</p>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handlePreviewFile(file)}
                  >
                    <File className="h-3.5 w-3.5 text-blue-500" />
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <Eye className="h-3.5 w-3.5 ml-1 text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {custom && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Switch 
            id={id} 
            checked={active} 
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-blue-500"
          />
          <Label htmlFor={id} className="sr-only">
            Enable {name}
          </Label>
        </div>
      </div>

      <FilePreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={selectedFile}
      />
    </motion.div>
  );
}