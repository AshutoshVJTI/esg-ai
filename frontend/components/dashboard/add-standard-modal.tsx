import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, File, Loader } from "lucide-react";
import { uploadFile, createStandard } from "@/lib/api";
import { toast } from "sonner";
import { Standard } from "@/lib/types";

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

interface AddStandardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddStandard: (standard: Standard) => void;
}

export function AddStandardModal({ open, onOpenChange, onAddStandard }: AddStandardModalProps) {
  const [newStandard, setNewStandard] = useState<Partial<CustomStandard>>({
    name: "",
    description: "",
    categories: [],
    files: []
  });
  const [categoryInput, setCategoryInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddStandard = async () => {
    if (!newStandard.name) return;
    
    try {
      setIsUploading(true);
      
      // Upload files first if there are any
      const uploadedFiles: Array<{name: string; url: string; size: number; type: string}> = [];
      if (newStandard.files && newStandard.files.length > 0) {
        for (const file of newStandard.files) {
          const result = await uploadFile(file);
          uploadedFiles.push({
            name: file.name,
            url: result.fileUrl,
            size: file.size,
            type: file.type
          });
        }
      }
      
      // Create the standard with the uploaded file URLs
      const standardData: Partial<Standard> = {
        name: newStandard.name || "",
        description: newStandard.description || "",
        categories: newStandard.categories || [],
        isCustom: true,
        isActive: true
      };
      
      // Add files if there are any
      if (uploadedFiles.length > 0) {
        // @ts-ignore - The backend will handle the file structure correctly
        standardData.files = uploadedFiles;
      }
      
      const createdStandard = await createStandard(standardData);
      
      // Call the onAddStandard callback with the created standard
      onAddStandard(createdStandard);
      
      // Reset form
      setNewStandard({
        name: "",
        description: "",
        categories: [],
        files: []
      });
      setCategoryInput("");
      
      toast.success("Custom standard added successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to add custom standard");
      console.error("Error adding custom standard:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  const addCategory = () => {
    if (!categoryInput.trim()) return;
    
    setNewStandard(prev => ({
      ...prev,
      categories: [...(prev.categories || []), categoryInput.trim()]
    }));
    setCategoryInput("");
  };
  
  const removeCategory = (index: number) => {
    setNewStandard(prev => ({
      ...prev,
      categories: prev.categories?.filter((_, i) => i !== index)
    }));
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      alert('Please select PDF files only');
      return;
    }
    
    // Add preview URLs for display
    const filesWithPreview = pdfFiles.map(file => {
      const fileWithPreview = file as FileWithPreview;
      fileWithPreview.preview = URL.createObjectURL(file);
      return fileWithPreview;
    });
    
    setNewStandard(prev => ({
      ...prev,
      files: [...(prev.files || []), ...filesWithPreview]
    }));
  };
  
  const removeFile = (index: number) => {
    setNewStandard(prev => {
      const updatedFiles = [...(prev.files || [])];
      
      // Revoke object URL to prevent memory leaks
      const file = updatedFiles[index] as FileWithPreview;
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
      
      updatedFiles.splice(index, 1);
      return {
        ...prev,
        files: updatedFiles
      };
    });
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] backdrop-blur-xl bg-white/90 dark:bg-gray-900/90 border-0 shadow-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Custom Standard</DialogTitle>
          <DialogDescription>
            Create your own custom standard or guideline to track compliance.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Standard Name
            </Label>
            <Input 
              id="name" 
              value={newStandard.name || ''} 
              onChange={(e) => setNewStandard({...newStandard, name: e.target.value})}
              className="rounded-lg border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              placeholder="e.g. Internal Carbon Policy"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea 
              id="description" 
              value={newStandard.description || ''} 
              onChange={(e) => setNewStandard({...newStandard, description: e.target.value})}
              className="rounded-lg border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 min-h-[100px]"
              placeholder="Describe the purpose and scope of this standard"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Categories
            </Label>
            <div className="flex gap-2">
              <Input 
                value={categoryInput} 
                onChange={(e) => setCategoryInput(e.target.value)}
                className="rounded-lg border-gray-200 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                placeholder="e.g. Internal"
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              />
              <Button 
                type="button" 
                onClick={addCategory}
                className="rounded-lg"
              >
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {newStandard.categories?.map((category, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="rounded-full px-3 py-1 text-sm font-medium bg-gray-100 dark:bg-gray-800 flex items-center gap-1"
                >
                  {category}
                  <button 
                    type="button" 
                    onClick={() => removeCategory(index)}
                    className="ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              PDF Documents
            </Label>
            <div className="mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                multiple
                className="hidden"
              />
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                onClick={triggerFileInput}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Click to upload PDF documents
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Upload your custom standard PDFs
                </p>
              </div>
            </div>
            
            {newStandard.files && newStandard.files.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Uploaded Files:</p>
                <div className="space-y-2">
                  {newStandard.files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 rounded-full text-gray-500 hover:text-red-500"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="rounded-full"
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddStandard}
            className="rounded-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            disabled={!newStandard.name || isUploading}
          >
            {isUploading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Add Standard"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 